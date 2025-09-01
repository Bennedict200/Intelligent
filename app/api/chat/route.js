import { NextResponse } from "next/server";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import path from "node:path";
import fs from "fs";

class PdfQA {
  constructor(model, pdfDocument, chunkSize, chunkOverlap, searchType = "similarity", kDocuments) {
    this.model = model;
    this.pdfDocument = pdfDocument;
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.searchType = searchType;
    this.kDocuments = kDocuments;
  }

  async init() {
    this.llm = new Ollama({ model: this.model });
    const pdfLoader = new PDFLoader(path.join(process.cwd(), "./app/uploads", this.pdfDocument));
    this.documents = await pdfLoader.load();

    const textSplitter = new CharacterTextSplitter({
      separator: " ",
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
    });
    this.texts = await textSplitter.splitDocuments(this.documents);

    this.embeddings = new OllamaEmbeddings({ model: "all-minilm:latest" });
    this.db = await MemoryVectorStore.fromDocuments(this.texts, this.embeddings);

    this.retriever = this.db.asRetriever({ k: this.kDocuments, searchType: this.searchType });

    const prompt = ChatPromptTemplate.fromTemplate(
        `Answer the user's question in a structured numbered list.  

        Formatting rules:
        - Each main point must start on a new line with "1.", "2.", "3.", etc.
        - If a point has sub-points, each sub-point must start on a new line with "+"
        - Do not combine multiple points on one line
        - Keep sentences short and clear

        Question: {input}  
        Context: {context}`
    );
    const combineDocsChain = await createStuffDocumentsChain({
      llm: this.llm,
      prompt,
    });
    this.chain = await createRetrievalChain({
      combineDocsChain,
      retriever: this.retriever,
    });
    return this;
  }

  async query(input, history = []) {
    return await this.chain.invoke({ input, chat_history: history });
  }
}

let pdfQa = null;

export async function POST(req) {
  const { question, pdfName } = await req.json();

  if (!pdfQa) {
    pdfQa = await new PdfQA("llama3", pdfName, 1000, 100, "similarity", 5).init();
  }

  const answer = await pdfQa.query(question);
  return NextResponse.json({ answer });
}
