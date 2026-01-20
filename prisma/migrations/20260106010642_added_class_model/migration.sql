-- AlterTable
ALTER TABLE "FlashcardSet" ADD COLUMN     "classId" INTEGER NOT NULL DEFAULT -1;

-- CreateTable
CREATE TABLE "Class" (
    "id" INTEGER NOT NULL DEFAULT -1,
    "name" TEXT NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FlashcardSet" ADD CONSTRAINT "FlashcardSet_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
