import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAI } from 'langchain/llms/openai';
import { RunnableSequence } from "langchain/schema/runnable";
import { Document } from "langchain/document";
import { BaseMessage } from 'langchain/schema';

import { timeout } from './config';
import { PromptTemplate } from 'langchain/prompts';

const serializeDocs = (docs: Array<Document>): string =>
  docs.map((doc) => doc.pageContent).join("\n");

const serializeChatHistory = (chatHistory: Array<BaseMessage>): string =>
  chatHistory
    .map((chatMessage) => {
      if (chatMessage._getType() === "human") {
        return `Human: ${chatMessage.content}`;
      } else if (chatMessage._getType() === "ai") {
        return `Assistant: ${chatMessage.content}`;
      } else {
        return `${chatMessage.content}`;
      }
    })
    .join("\n");

const questionPrompt = PromptTemplate.fromTemplate(
  `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------
CONTEXT: {context}
----------
CHAT HISTORY: {chatHistory}
----------
QUESTION: {question}
----------
Helpful Answer:`
);

export const queryPineconeVectorStoreAndQueryLLM = async (
  client,
  indexName,
  question,
  chatHistory: Array<BaseMessage> | null = null // Include chat history as a parameter
) => {
  console.log('Querying Pinecone vector store...');
  const index = client.Index(indexName);
  const queryEmbedding = await new OpenAIEmbeddings().embedQuery(question);
  
  let queryResponse = await index.query({
    queryRequest: {
      topK: 10,
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: true,
    },
  });
  
  console.log(`Found ${queryResponse.matches.length} matches...`);
  console.log(`Asking question: ${question}...`);
  
  if (queryResponse.matches.length) {
    const llm = new OpenAI({});
    const concatenatedPageContent = queryResponse.matches
      .map((match) => match.metadata.pageContent)
      .join(" ");
      
    const chain = RunnableSequence.from([
      {
        question: () => question,
        chatHistory: () => chatHistory ?? "",
        context: () => serializeDocs([new Document({ pageContent: concatenatedPageContent })]),
      },
      questionPrompt,
      llm,
      (input) => ({ text: input.text }),
    ]);
    
    const result = await chain.invoke({});
    console.log(`Answer: ${result.text}`);
    return result.text;
  } else {
    console.log('Since there are no matches, GPT-3 will not be queried.');
    return 'No matches found, GPT-3 was not queried.';  // Added this line
    }

};
