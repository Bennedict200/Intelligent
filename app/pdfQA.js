import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import path from "node:path";
// import { RetrievalQAChain } from "langchain/chains";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

 class PdfQA{
    //define a class constructor
    //accept one parameter (model)
    constructor(model, pdfDocument, chunkSize, chunkOverlap, searchType="similarity", kDocuments){
        this.model = model;//add the argument passed to model to the class property model
        this.pdfDocument = pdfDocument;// pass the PDF document pathname
        this.chunkSize = chunkSize;//maximum number of characters of the final doc
        this.chunkOverlap = chunkOverlap;//overlap between chunk do that the text isnt split weirdly
        
        //for more advance search type use "mmr" [Maximal Marginal Relevance]
        this.searchType = searchType;//configure the type of vector search. By default its "similarity".
        this.kDocuments = kDocuments;//the number of relevant docs to return based on the search
    }

    //special initializer method
    async init(){
        this.initChatModel();//load the LLM
        await this.loadDocuments();//await for provided documents to be loaded
        await this.splitDocuments()
        this.selectEmbedding = new OllamaEmbeddings({model: "all-minilm:latest"});//convert the document to embeddings
        await this.createVectorStore();// initialize vector store
        this.createRetriever()
        await this.createChain()//connects all the above together
        return this;//return this to retain access to the main object after calling init() 
    }

    initChatModel(){
        console.log("Loading model...");
        this.llm = new Ollama({ model: this.model })//use the Ollama Langchain class to load an LLM
        //*********************for testing if the model is working********************************
        //Use the invoke() method  to ask a question to the LLM
        /*const response = await this.llm.invoke("how to load a file using node.js")
        console.log(response)*/
    }

    async loadDocuments(){
       console.log("Loading PDFs...");

       const pdfLoader = new PDFLoader(path.join(import.meta.dirname,this.pdfDocument));
       this.documents = await pdfLoader.load()
    }

    async splitDocuments(){
       console.log("Splitting Documents...");

       const textSplitter = new CharacterTextSplitter({
        separator:" ",
        shunkSize: this.chunkOverlap,
        chunkOverlap: this.chunkOverlap,
       }); 
       this.texts = await textSplitter.splitDocuments(this.documents)
    }

    async createVectorStore(){
        console.log("Creating document embeddings...");
        this.db = await MemoryVectorStore.fromDocuments(this.texts, this.selectEmbedding)
    }

    createRetriever(){
        console.log("Initialize vector store retriever");
        this.retriever = this.db.asRetriever({
            k: this.kDocuments,
            searchType: this.searchType
        });  
    }

    async createChain(){
        console.log("Creating retrieval QA chain...");
        // const chain = RetrievalQAChain.fromLLM(this.llm, this.retriever);

        const prompt = ChatPromptTemplate.fromTemplate(`Answer the user's question: {input}
            based on the following context {context}`)
        const combineDocsChain = await createStuffDocumentsChain({
            llm: this.llm,
            prompt,
        });
        this.chain = await createRetrievalChain({
            combineDocsChain,
            retriever: this.retriever,
        });
        return this.chain;
    }

    //helper to return chain
    queryChain(){
        return this.chain;
    }
}
//Instantiate our class store the object returned in a variable
const pdfDocument = "./materials/MNE3701.pdf";
const pdfQa = await new PdfQA( "llama3", pdfDocument, 1000, 0, "similarity", 5 ).init();

// console.log("Embedding model: ", pdfQa.db.embeddings.model );
// console.log("# of embeddings: ", pdfQa.db.memoryVectors.length);

// console.log(pdfQa.db);
// console.log(pdfQa.db.embeddings);
// console.log(pdfQa.db.memoryVectors[0]);

// const similaritySearchResults = await pdfQa.db.similaritySearch("What determines a company's profitability",2)//(search term , 2 results)
// console.log("\nDocument pages related to our query");
// for (const doc of similaritySearchResults){//for showing search results
//     console.log(`\n* ${JSON.stringify(doc.metadata.loc, null)}\n`);
//     console.log(doc.pageContent);
    
// }
// const embeddingText = await pdfQa.selectEmbedding.embedQuery("Management team")
// const similaritySearchWithScoreResults = await pdfQa.db.similaritySearchVectorWithScore(embeddingText,10)

// console.log("Document pages and their score related to query: ");
// for (const [doc, score] of similaritySearchWithScoreResults){
//     console.log(`* [SIM=${score.toFixed(3)}] [Page number: ${doc.metadata.loc.pageNumber}]`);    
// }


//console.log(pdfQa.texts)

// //log object
// console.log(pdfQa.documents.length);// document spliting 

// //the document text content
// console.log("\n\nDocument #0 page content: ",pdfQa.documents[1].pageContent);

// //the Document metadata
// console.log("\n\nDocument #0 metadata: ",pdfQa.documents[1].metadata);

// console.log("# of returned documents: ", pdfQa.retriever.k);
// console.log("search type: ", pdfQa.retriever.searchType);

// const relevantDocuments = await pdfQa.retriever.invoke("what are management teams?")
// console.log(relevantDocuments);

// await pdfQa.createChain()
const PdfQaChain = pdfQa.queryChain()
// console.log(PdfQaChain)
const answer1 = await PdfQaChain.invoke({input: "what are management teams?"})
console.log("*",answer1.answer,"\n");
console.log("# of documents used as context: ", answer1.context.length,"\n");

//store the previous question along with its answer in an array
const chatHistory1 = [ answer1.input , answer1.answer ]

const answer2 = await PdfQaChain.invoke({
    input : "Why are strategic alliances important for many small businesses?",
    chat_history : chatHistory1
});
console.log("*",answer2.answer,"\n");
