import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import 'dotenv/config';
import ollama from 'ollama';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {compare, hash} from "bcrypt"
import  sign  from "jsonwebtoken"
import jwt from 'jsonwebtoken'
import * as bcrypt from 'bcrypt'
import { authentication } from './middlewares/auth.mjs'
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter }); 
const generateJwt = (user)  => {
  return jwt.sign({email: user.email},'JWT_SECRET')
}


dotenv.config();

const port = process.env.PORT || 3000;
const app = express();

const DEFAULT_CHAT_MODEL = "phi3:mini";


app.use(cors());
app.use(express.json());

prisma.$connect()
  .then(() => console.log("Prisma connected!"))
  .catch((e) => {
    console.error("Prisma connection error:", e);
    process.exit(1);
  });
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





app.post("/postClass", authentication,  async (req, res) => {
  try{
    const {name} = req.body;
    if (!name){
      return res.status(400).json({message: "Please enter class name"});
    }
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No valid session found." });
    }
    const class_to_create = await prisma.class.create({
      data: {
        name,
        userId: req.user.id
      }
    });
    return res.status(200).json({ message: "Class created successfully", data: class_to_create });
  }
  catch(error){
    console.error("POST Class Error:", error); // Log the actual error to your terminal
    return res.status(500).json({
      message: "Error creating Class", 
      error: error.message 
    });
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
app.post("/post/:classId", async (req, res) => {
  const {classId} = req.params;
  try {
    const { title, description} = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Please input Title and Description" });
    }
    const set = await prisma.flashcardSet.create({
      data: { title, 
        description, 
        Class: { connect: { id: classId } },
      },
    });
    return res.status(201).json({ message: "Set created successfully", data: set });
  } catch (error) {
    return res.status(500).json({ message: "Error creating set", error: error.message });
  }
}); 

app.get("/sets/:classId", async (req, res) => {
  const {classId} = req.params;
  try {
    const sets = await prisma.flashcardSet.findMany({
      where: {
        classId: classId,
      },
    });
    return res.status(200).json({ data: sets.length, sets });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sets", error: error.message });
  }
}); 


app.get("/classes", authentication, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No valid session found." });
    }
    const classes = await prisma.class.findMany({
      where: {
        userId: req.user.id,
      }
  });
    return res.status(200).json({ data: classes.length, classes });
  } catch (error) {
    console.error("Classes Error:", error.message);
    return res.status(500).json({ message: "Error fetching classes", error: error.message });
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

app.delete("/deleteClass", async (req, res) => {
  try {
    const { classId, id } = req.body || {};
    const cid = classId || id;
    if (!cid) {
      return res.status(400).json({ message: "Invalid class ID" });
    }
    const sets = await prisma.flashcardSet.findMany({
      where: { classId: cid },
      select: { id: true },
    });
    const setIds = sets.map(s => s.id);

    if (setIds.length > 0) {
      await prisma.flashcard.deleteMany({ where: { flashcardSetId: { in: setIds } } });
      await prisma.flashcardSet.deleteMany({ where: { id: { in: setIds } } });
    }

    const deletedClass = await prisma.class.delete({ where: { id: cid } }); 
    return res.json(deletedClass);
  } catch (error) {
    console.error("Error deleting class:", error);
    return res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
});

app.post("/users/register", async(req, res) => {
  try{
   const hashedPassword = await hash(req.body.password, 10);
   const { name, email, password} = req.body; 
   console.log(password)
   console.log(name)
   console.log(email)
   if (!name || !password || !email){
    res.json({ message: 'Missing fields'})
   }
   const user = await prisma.user.create({
      data :  {
        
        name: name, 
        email: email, 
        password: hashedPassword,
      },
    }); 
    const {password: _password, ...userWithoutPassword} = user
    res.json({...userWithoutPassword, token: generateJwt(user)});
  }
  catch(err){
    res.json({error:err.message})
    
  }
});

app.post('/users/login', async (req, res) =>{
   try{

      const user = await prisma.user.findUnique({
        where:{
          email: req.body.email
        }
      })
      if (!user){
        throw new Error('User not found')
      }
      const isPasswordCorrect = await compare(req.body.password, user.password)
      if(!isPasswordCorrect){
        throw new Error('Incorrect password')
      }
      const {password: _password, ...userWithoutPassword} = user
    res.json({...userWithoutPassword, token: generateJwt(user)});
   }
   catch(err){
    res.json({error: 'Email or password are wrong'})
   }
}) 

app.get("/users", authentication, async(req, res, next) => {
    try {
      if (!req.user){
        return res.sendStatus(401);
      }
      console.log(req.user)
      const user = await prisma.user.findUnique({ where: { email: req.user.email } }); 
      const {password: _password, ...userWithoutPassword} = user
      res.json({...userWithoutPassword, token: generateJwt(user)});
    }
    catch(err){
      next(err)
    }
})



app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});