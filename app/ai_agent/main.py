from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

llm = OllamaLLM(model="llama3.1")
template = """
You are a study assistant, that is going to quiz a student based 
on the flashcards that they created:

Here is the flashcard set: {flashcards}

Ask a question based on the set.

""" 

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | llm 
while True: 
    response = input("Here is your question: ")
    if response == "q":
        break

result = chain.invoke({"flashcards": []})
print(result)
