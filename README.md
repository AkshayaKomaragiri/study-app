# Study Forge

A study assistant application for organizing classes, flashcard sets, and learning with AI-powered quizzes.

## Images
![alt text](image-1.png) 
![alt text](image-2.png)
![alt text](image-3.png)
![alt text](image.png)


## Capabilities

- **Classes** — Create and manage classes. Each class can contain multiple flashcard sets.
- **Flashcard Sets** — Organize flashcards into sets with titles and descriptions. Add, browse, and navigate cards within a set.
- **Flashcards** — Create question/answer pairs. Browse cards or switch to Learn mode for interactive practice.
- **Learn Mode** — AI-generated multiple-choice quizzes. Mistral AI produces 3 plausible distractors per question; the correct answer is shown among 4 shuffled options. Progress tracking and completion feedback.
- **Quiz** — AI-powered quiz generation for learning.
- **Authentication** — Sign up, login, and JWT-based auth. Protected routes for classes and user data.
- **Chat** — Ollama chat integration for streaming and non-streaming responses (configurable models).

## Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS, MUI Joy, Radix UI
- **Backend:** Express.js, Prisma, PostgreSQL
- **AI:** Mistral AI (distractors)
- **Auth:** JWT, bcrypt

## Project Structure

```
├── app/
│   ├── (pages)/         # Route pages
│   │   ├── classes/     # User classes
│   │   ├── sets/        # Flashcard sets per class
│   │   ├── flashcards/  # Flashcards and Learn mode
│   │   ├── quiz/        # Quiz
│   │   ├── login/       # Login
│   │   └── signup/      # Sign up
│   ├── api/
│   │   └── generate/    # Mistral AI distractors API
│   └── server/          # Express API (classes, flashcards, etc.)
├── components/
├── prisma/
│   └── schema.prisma    # User, Class, FlashcardSet, Flashcard
└── app/docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL (or Docker)
- Mistral AI API key (for Learn mode distractors)

### Setup

1. Create `.env` in the project root:

```env
DATABASE_URL="postgresql://postgres:study@localhost:5433/flashcards_db"
MISTRAL_API_KEY="your_mistral_api_key"
JWT_SECRET="your_jwt_secret"
```

2. Start PostgreSQL (e.g. via Docker):

```bash
docker compose -f app/docker-compose.yml up -d
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

4. Install dependencies and run:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` (Express) and the Next.js dev server runs concurrently. Ensure the Express server runs on port 3000 and Next.js on its default port (e.g. 3001).

### Scripts

| Command       | Description                          |
|---------------|--------------------------------------|
| `npm run dev` | Run Express server + Next.js dev     |
| `npm run build` | Build Next.js for production         |
| `npm run start` | Start Next.js production server     |
| `npm run lint` | Run ESLint                           |

## Data Model

- **User** — name, email, password; owns classes
- **Class** — name; belongs to user; contains flashcard sets
- **FlashcardSet** — title, description; belongs to class; contains flashcards
- **Flashcard** — question, answer; belongs to flashcard set
