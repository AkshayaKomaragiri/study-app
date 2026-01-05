import "./(pages)/globals.css";
import Navbar from "./(pages)/components/navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Navbar 
          name="The Study Forge"
          flashcardsButton="Flashcards"
          viewSets="View Sets"
          quizButton="Quiz"
          history="History"
        />
        {children}
      </body>
    </html>
  );
}
