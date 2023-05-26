import { useState } from "react";

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("キャラ");
  const [ids, setIds] = useState<string[]>([]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    const url = `/api/s?keyword=${encodeURIComponent(
      keyword
    )}&type=${encodeURIComponent(type)}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIds(data.ids);
      } else {
        console.error("API request failed:", res.status);
      }
    } catch (error) {
      console.error("API request error:", error);
    }
  };

  return (
    <div>
      <h1>AikatsUP (Experimental)</h1>
      <p>
        Source code:
        <a href="https://github.com/kaosf/aikatsup">kaosf/aikatsup</a>
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="keyword">
          Keyword:
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        <br />
        <label htmlFor="type">
          Type:
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="キャラ">キャラ</option>
            <option value="セリフ">セリフ</option>
          </select>
        </label>
        <br />
        <button type="submit">Search</button>
      </form>
      <div>
        <h2>IDs:</h2>
        {ids.length > 0 ? (
          <>
            <p>Total: {ids.length}</p>
            <ul>
              {ids.map((id, index) => (
                <li key={index}>{id}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
}
