"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question) return;
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question, pdfName: "MNE3701.pdf" }), // use your PDF name
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    setChat([...chat, { q: question, a: data.answer.answer }]);
    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 p-2">
      <h1 className="text-gray-900 text-5xl font-bold p-1">Intelligent</h1>
      <h5 className="text-gray-500 text-xl p-1">make learning faster</h5>

      <div className="w-full max-w-7xl bg-white rounded-2xl shadow p-4">
        <div className="h-100 overflow-y-auto border-b border-gray-200 mb-4 p-2 space-y-4">
          {chat.map((c, i) => (
            <div key={i} className="space-y-1">
              <p className="font-semibold text-gray-700">❓ {c.q}</p>
              <div className="text-gray-600 bg-gray-100 p-2 rounded prose prose-sm">
                <ReactMarkdown>{c.a}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && <p className="text-gray-400">Thinking...</p>}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the PDF..."
          />
          <button
            onClick={askQuestion}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-orange-400"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}




// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="bg-gray-300 h-full w-full flex flex-col justify-center items-center">
//       <h1 className="text-gray-900 text-8xl font-bold">Intelligent </h1>
//       <h5 className="text-gray-500 text-3xl">make learning faster</h5>

//       <p className="mt-7 text-xl">Upload your pdf and then start interacting with on your pdf </p>
//       <input className="p-2 mt-2 bg-amber-50 rounded-xl text-xl text-center w-3/12 text-gray-500 " type="file"></input>
//       <button className="bg-gray-700 text-gray-400 mt-6 p-3 font-bold text-2xl rounded-xl w-3/14 hover:bg-amber-500 hover:text-gray-900">Upload PDF</button>

//     </div>
//     // ------------------------------------------------------About section-----------------------------------------------------------------------
//   );
// }
