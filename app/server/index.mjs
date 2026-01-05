import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config';
import ollama from 'ollama';
import { PrismaClient } from "@prisma/client";


dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

const DEFAULT_CHAT_MODEL = "phi3:mini";


app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));


// Middleware to log requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Error handling middleware 
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/models', async (req, res) => {
    try {
        const modelList = await ollama.list();
        res.json(modelList);
    } catch (error) {
        console.error("Error fetching models:", error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

app.post('/chat', async (req, res) => {
    const {
        messages,
        stream = false,
        temperature = 0.7,
        model
    } = req.body;

    if (!messages) {
        return res.status(400).json({ error: 'Missing messages' });
    }

    const selectedModel = model || DEFAULT_CHAT_MODEL;

    try {
        if (stream) {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });

            const chatResponse = await ollama.chat({
                model: selectedModel,
                messages,
                stream: true,
                temperature
            });

            for await (const chunk of chatResponse) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            res.end();
        } else {
            const response = await ollama.chat({
                model: selectedModel,
                messages,
                temperature
            });

            res.json({ response: response.message.content });
        }
    } catch (error) {
        console.error("Error during chat:", error);
        res.status(500).json({ error: 'Chat request failed' });
    }
});


app.post('/generate', async (req, res) => {
    const { model, prompt, temperature = 0.7 } = req.body;

    if (!model || !prompt) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const response = await ollama.generate({ model, prompt, temperature }); 
        res.json(response);
    } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).json({ error: 'Text generation failed' });
    }
});

app.post('/embeddings', async (req, res) => {
    const { model, input } = req.body;

    if (!model || !input) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const response = await ollama.embed({ model, input });
        res.json(response);
    } catch (error) {
        console.error("Error generating embeddings:", error);
        res.status(500).json({ error: 'Embedding generation failed' });
    }
});



app.post("/post", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Please input Title and Description" });
    }
    const set = await prisma.flashcardSet.create({
      data: { title, description },
    });
    return res.status(201).json({ message: "Set created successfully", data: set });
  } catch (error) {
    return res.status(500).json({ message: "Error creating set", error: error.message });
  }
});

app.post("/postFlashcard", async (req, res) => {
  try {
    const { question, answer, flashcardSetId } = req.body;
    if (!question || !answer || !flashcardSetId) {
      return res.status(400).json({ message: "Please input question, answer and flashcardSetId" });
    }
    const flashcard = await prisma.flashcard.create({
      data: {
        question,
        answer,
        flashcardSet: { connect: { id: Number(flashcardSetId) } },
      },
    });
    return res.status(201).json({ message: "Flashcard created successfully", data: flashcard });
  } catch (error) {
    return res.status(500).json({ message: "Error creating flashcard", error: error.message });
  }
});

app.get("/sets", async (req, res) => {
  try {
    const sets = await prisma.flashcardSet.findMany();
    return res.status(200).json({ data: sets.length, sets });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sets", error: error.message });
  }
});

app.get("/flashcards", async (req, res) => {
  try {
    const flashcards = await prisma.flashcard.findMany();
    return res.status(200).json({ data: flashcards.length, flashcards });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching flashcards", error: error.message });
  }
});

app.delete("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid set ID" });
    }
    const deletedSet = await prisma.flashcardSet.delete({
      where: { id: Number(id) },
    });
    return res.json(deletedSet);
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});