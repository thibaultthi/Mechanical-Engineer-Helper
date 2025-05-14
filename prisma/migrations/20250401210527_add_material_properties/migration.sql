/*
  Warnings:

  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Material";

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "density" DOUBLE PRECISION,
    "youngsModulus" DOUBLE PRECISION,
    "yieldStrength" DOUBLE PRECISION,
    "ultimate_tensile_strength" DOUBLE PRECISION,
    "poissons_ratio" DOUBLE PRECISION,
    "shear_modulus" DOUBLE PRECISION,
    "thermal_expansion_coefficient" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materials_name_key" ON "materials"("name");
