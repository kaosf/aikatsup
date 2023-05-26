import { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";
import path from "path";
import * as crypto from "crypto";
import * as http from "http";
import * as https from "https";
import { parse } from "csv-parse/sync";

const filepath = path.join(
  process.cwd(),
  "api-tmp-files",
  "aikatsup20230422.csv"
);
const expectedSha256 =
  "14648f557a2ad394b513c0800afd3b1f4d1ee23964f501820a392cb6779a9a19";

const checksumOk = (): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const sha256sum = crypto.createHash("sha256");
    const stream = fs.createReadStream(filepath);
    stream.on("data", (data) => sha256sum.update(data));
    stream.on("end", () => {
      const hash = sha256sum.digest("hex");
      if (hash === expectedSha256) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    stream.on("error", (error) => reject(error));
  });

const download = (url: string, isHttps: boolean = true): Promise<void> =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const client = isHttps ? https : http;
    client.get(url, (response) => {
      response.pipe(file);
      file
        .on("finish", () => {
          file.close();
          resolve();
        })
        .on("error", (err) => {
          fs.unlink(filepath, () => {});
          console.error(`Error downloading file: ${err.message}`);
          reject();
        });
    });
  });

const prepare = async () => {
  if (fs.existsSync(filepath) && (await checksumOk())) return;
  await download(
    "https://raw.githubusercontent.com/kaosf/AikatsuDOWN/master/data/aikatsup20230422.csv"
  );
  if (fs.existsSync(filepath) && (await checksumOk())) return;
  await download("http://aikatsup.com/static/aikatsup20230422.csv", false);
  if (fs.existsSync(filepath) && (await checksumOk())) return;

  console.error("CSV file could not be prepared.");
  throw new Error("CSV file could not be prepared.");
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    await prepare();
  } catch {
    res.statusCode = 422;
    res.json({ message: "Error" });
    return;
  }

  const { keyword, type } = req.query;
  if (
    keyword instanceof Array<string> ||
    keyword === undefined ||
    type instanceof Array<string> ||
    type === undefined
  ) {
    res.statusCode = 422;
    res.json({ message: "Error" });
    return;
  }

  const buffer = fs.readFileSync(filepath);
  const rows = parse(buffer, { relax_column_count: true }) as string[][];

  let ids: string[] = [];
  switch (type) {
    case "キャラ":
      ids = rows
        .filter((row) => row.slice(4).find((column) => column === keyword))
        .map((row) => row[0]);
      break;
    case "セリフ":
      const r = new RegExp(keyword);
      ids = rows.filter((row) => r.test(row[1])).map((row) => row[0]);
      break;
    default:
      console.error("Invalid type.");
      res.statusCode = 422;
      res.json({ message: "Error" });
      return;
  }

  res.statusCode = 200;
  res.json({ ids });
};

// See also: https://gist.github.com/kaosf/d91c7a0ec8379f3d46eb05091fc2f078
