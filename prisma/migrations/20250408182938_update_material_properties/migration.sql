/*
  Warnings:

  - You are about to drop the column `poissons_ratio` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `relativeCost` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `shear_modulus` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `thermal_expansion_coefficient` on the `materials` table. All the data in the column will be lost.
  - You are about to drop the column `ultimate_tensile_strength` on the `materials` table. All the data in the column will be lost.
  - Made the column `category` on table `materials` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "materials" DROP COLUMN "poissons_ratio",
DROP COLUMN "relativeCost",
DROP COLUMN "shear_modulus",
DROP COLUMN "thermal_expansion_coefficient",
DROP COLUMN "ultimate_tensile_strength",
ADD COLUMN     "compressiveStrength" DOUBLE PRECISION,
ADD COLUMN     "elongationAtBreak" DOUBLE PRECISION,
ADD COLUMN     "fiberType" TEXT,
ADD COLUMN     "flexuralStrength" DOUBLE PRECISION,
ADD COLUMN     "fractureToughness" DOUBLE PRECISION,
ADD COLUMN     "hdt" DOUBLE PRECISION,
ADD COLUMN     "matrixType" TEXT,
ADD COLUMN     "maxServiceTemperature" DOUBLE PRECISION,
ADD COLUMN     "meltingPoint" DOUBLE PRECISION,
ADD COLUMN     "poissonsRatio" DOUBLE PRECISION,
ADD COLUMN     "shearModulus" DOUBLE PRECISION,
ADD COLUMN     "thermalExpansionCoefficient" DOUBLE PRECISION,
ADD COLUMN     "ultimateTensileStrength" DOUBLE PRECISION,
ALTER COLUMN "category" SET NOT NULL;
