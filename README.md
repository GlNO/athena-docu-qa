# Athena | Document Q&A

## An AI-powered Document Q&A application.
A Document Question-Answering System where users upload a PDF, ask questions about its contents, and receive answers grounded in the document rather than the model's general knowledge.

### Project Purpose
Athena is a personal project developed to explore AI-powered applications, document processing, and retrieval-augmented generation (RAG). Inspired by an online course that introduced me to the various applications of artificial intelligence, I decided to build Athena as a hands-on learning experience. 
> Through this project, I aim to deepen my understanding of prompt engineering, document retrieval, and local AI deployment. By combining these concepts altogether; I can explore how AI models process information, retrieve relevant context, and generate answers grounded in provided documents.



### 🐛 **A little heads-up:** 
Athena is a <b> locally run project and is not currently deployed as a publicly accessible application. </b>
Running it requires setting up the frontend, backend, and local AI model through Ollama.
The application is intended for learning and experimentation with AI-powered document processing, prompt engineering, and retrieval-augmented generation (RAG).



<h2> Project Demo </h2>
![App Demo](https://raw.githubusercontent.com/GlNO/athena-docu-qa/main/src/front/assets/Athena_Demo.gif)

<img width="800" height="450" alt="Athena_Demo" src="https://github.com/user-attachments/assets/9c2c72ec-e542-44bf-af2c-b4b233e77fda" />

---
<h3> Project Images </h3>
<img width="90%" height="90%" alt="image" src="https://github.com/user-attachments/assets/2b119a83-547b-45b9-a842-faa93aafd311" />
<img width="90%" height="90%" alt="image" src="https://github.com/user-attachments/assets/447838eb-a586-4879-948d-ef537ca41988" />
<img width="90%" height="90%" alt="image" src="https://github.com/user-attachments/assets/b6a81ed5-3ffc-426f-8556-2721e9954e23" />


## Features

- Upload text-based PDF documents
- Ask questions about document contents
- Generate context-aware answers using an AI model (qwen2.5:3b-instruct)
- Stream answers as Athena generates them
- Get answers grounded in the uploaded document


## Technologies used:

<div align="center">
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/rest.png" alt="REST" title="REST"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/css.png" alt="CSS" title="CSS"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/react.png" alt="React" title="React"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/typescript.png" alt="TypeScript" title="TypeScript"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/vite.png" alt="Vite" title="Vite"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/python.png" alt="Python" title="Python"/></code>
	<code><img width="32" src="https://raw.githubusercontent.com/marwin1991/profile-technology-icons/refs/heads/main/icons/fastapi.png" alt="FastAPI" title="FastAPI"/></code>
</div>

<div align="left">
  <br>
<ul> 

<li> <b> Embedding model: </b> <code> sentence-transformers/all-MiniLM-L6-v2 </code></li>
<li> <b> Vector database: </b> <code>  ChromaDB with persistent local storage </code></li>
<li> <b> LLM: </b> Ollama, ran locally with <code> qwen2.5:3b-instruct </code></li>

</ul>

</div>
 
---

*Athena — Knowledge, within reach.*
