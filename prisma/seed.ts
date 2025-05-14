import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// Define the type reflecting the NEW schema
interface MaterialData {
  name: string;
  category: string; // Required
  density: number | null;
  youngsModulus: number | null;
  ultimateTensileStrength: number | null;
  thermalExpansionCoefficient: number | null;
  yieldStrength: number | null;
  poissonsRatio: number | null;
  shearModulus: number | null;
  elongationAtBreak: number | null;
  compressiveStrength: number | null;
  flexuralStrength: number | null;
  fractureToughness: number | null;
  meltingPoint: number | null;
  hdt: number | null;
  maxServiceTemperature: number | null;
  fiberType: string | null;
  matrixType: string | null;
}

// Helper function to calculate Shear Modulus (G) from Young's Modulus (E) and Poisson's Ratio (v)
// G = E / (2 * (1 + v))
function calculateShearModulus(youngsModulus: number | null | undefined, poissonsRatio: number | null | undefined): number | null {
  if (youngsModulus == null || poissonsRatio == null) {
    return null;
  }
  if (poissonsRatio <= -1) {
      return null; // Avoid division by zero or near-zero
  }
  return youngsModulus / (2 * (1 + poissonsRatio));
}

// Helper to build Prisma payload, handling nulls
// This single helper can be used for both create and update in upsert
function createMaterialPayload(mat: MaterialData, calculatedShearModulus: number | null): Prisma.MaterialCreateInput | Prisma.MaterialUpdateInput {
  const payload: any = { // Start with any, then assign known types
    name: mat.name,
    category: mat.category, // Required
  };

  // Assign optional fields only if they are not null in the source data
  const optionalFields: (keyof MaterialData)[] = [
    'density', 'youngsModulus', 'ultimateTensileStrength', 'thermalExpansionCoefficient',
    'yieldStrength', 'poissonsRatio', 'elongationAtBreak', 'compressiveStrength',
    'flexuralStrength', 'fractureToughness', 'meltingPoint', 'hdt', 'maxServiceTemperature',
    'fiberType', 'matrixType'
  ];

  optionalFields.forEach(key => {
    if (mat[key] !== null && mat[key] !== undefined) {
      payload[key] = mat[key];
    }
  });

  // Add shear modulus (either provided or calculated) if it's not null
  const finalShearModulus = mat.shearModulus ?? calculatedShearModulus;
  if (finalShearModulus !== null) {
     payload.shearModulus = finalShearModulus;
  }
  
  // Explicitly remove null optional fields if needed for 'update' specifically,
  // but upsert create/update handles this structure well.
  // For update, Prisma treats undefined fields as "no change", which is desired.
  // Explicitly setting a field to `null` in the update payload would actually nullify it in the DB.

  return payload as Prisma.MaterialCreateInput; // Upsert uses CreateInput structure
}


async function main() {
  console.log(`Start seeding with provided data...`);

  // ============================================================
  //  MATERIALS DATA BASED ON USER-PROVIDED SHEETS + LOOKUPS
  // ============================================================
  const materialsToSeed: MaterialData[] = [
    // --- METALS ---
    {
      name: 'AISI 1020 Steel, Hot Rolled',
      category: 'Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 345e6, // 50 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up (1/°C)
      yieldStrength: 221e6, // 32 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 25,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1020 Steel, Cold Worked',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 414e6, // 60 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 5,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1020 Steel, Stress Relieved',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1020 Steel, Annealed',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 331e6, // 48 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 193e6, // 28 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1020 Steel, Normalized',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 379e6, // 55 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 234e6, // 34 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 22,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEW AISI 1045 Entries ---
    {
      name: 'AISI 1045 Steel, Hot Rolled',
      category: 'Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up (1/°C)
      yieldStrength: 310e6, // 45 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1045 Steel, Cold Worked',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 5,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1045 Steel, Stress Relieved',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 483e6, // 70 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 8,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1045 Steel, Annealed',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 241e6, // 35 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 1045 Steel, Normalized',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 331e6, // 48 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'ASTM A36',
      category: 'Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 400e6, // 58 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up (1/°C)
      yieldStrength: 248e6, // 36 ksi -> Pa (approx)
      poissonsRatio: 0.30, // Used first value provided
      elongationAtBreak: 21,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A516 Grade 70',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 262e6, // 38 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 17,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4130, Hot Rolled',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 483e6, // 70 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4130, Stress Relieved',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 724e6, // 105 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 586e6, // 85 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4130, Annealed',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 379e6, // 55 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'AISI 4130, Normalized',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 414e6, // 60 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4140, Hot Rolled',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 621e6, // 90 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4140, Stress Relieved',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4140, Annealed',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 414e6, // 60 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 25,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 4140, Normalized',
      category: 'Steel',
      density: 7830, 
      youngsModulus: 200e9, 
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.3e-6, // Looked up
      yieldStrength: 621e6, // 90 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'ASTM A242',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 207e9, // 3.00E+07 psi -> Pa 
      ultimateTensileStrength: 462e6, // 67 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 317e6, // 46 ksi -> Pa (approx)
      poissonsRatio: 0.30, // Used first value
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A302 Grade A',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 310e6, // 45 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A302 Grade C',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 17,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A514, Quenched & Tempered',
      category: 'Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 758e6, // 110 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A517 Grade F',
      category: 'Steel',
      density: 7750, // 0.28 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 793e6, // 115 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'ASTM A533 Class 1',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A533 Class 2',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 483e6, // 70 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A533 Class 3',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 572e6, // 83 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A572 Grade 50',
      category: 'Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 207e9, // 3.00E+07 psi -> Pa 
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A588',
      category: 'Steel',
      density: 7750, // 0.28 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.97E+07 psi -> Pa (approx)
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH ---
    {
      name: 'ASTM A633 Grade E',
      category: 'Steel',
      density: 7750, // 0.28 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.97E+07 psi -> Pa (approx)
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 379e6, // 55 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A656 Grade 50',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 414e6, // 60 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A656 Grade 60',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 414e6, // 60 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 17,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A656 Grade 70',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 483e6, // 70 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 14,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A656 Grade 80',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A656 Grade 100',
      category: 'Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 758e6, // 110 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A710 Grade A',
      category: 'Steel',
      density: 7750, // 0.28 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.97E+07 psi -> Pa 
      ultimateTensileStrength: 586e6, // 85 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.7e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'HY-80',
      category: 'Steel',
      density: 7750, // 0.28 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.97E+07 psi -> Pa 
      ultimateTensileStrength: 690e6, // Looked up (approx 100 ksi)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'HY-100',
      category: 'Steel',
      density: 7860, // 0.284 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.97E+07 psi -> Pa 
      ultimateTensileStrength: 760e6, // Looked up (approx 110 ksi)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 201 Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, // 0.289 lb/in³ -> kg/m³ (approx)
      youngsModulus: 193e9, // 2.80E+07 psi -> Pa (approx)
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.0e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH ---
    {
      name: 'AISI 202 Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, // 0.289 lb/in³ -> kg/m³ (approx)
      youngsModulus: 193e9, // 2.80E+07 psi -> Pa (approx)
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.0e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 302 Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, 
      youngsModulus: 193e9, 
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.3e-6, // Looked up
      yieldStrength: 207e6, // 30 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 304 Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, 
      youngsModulus: 193e9, 
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.3e-6, // Looked up
      yieldStrength: 207e6, // 30 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 304L Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, 
      youngsModulus: 193e9, 
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.3e-6, // Looked up
      yieldStrength: 172e6, // 25 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 316 Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, 
      youngsModulus: 193e9, 
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.0e-6, // Looked up
      yieldStrength: 207e6, // 30 ksi -> Pa (approx)
      poissonsRatio: 0.26,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 316L Austenitic, Annealed',
      category: 'Stainless Steel',
      density: 8000, // 0.289 lb/in³ -> kg/m³ (approx)
      youngsModulus: 193e9, // 2.80E+07 psi -> Pa (approx)
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.0e-6, // Looked up
      yieldStrength: 172e6, // 25 ksi -> Pa (approx)
      poissonsRatio: 0.26,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 405 Ferritic',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 414e6, // 60 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.4e-6, // Looked up
      yieldStrength: 172e6, // 25 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 410 Martensitic, Annealed',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 9.9e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 410 Martensitic, Quenched & Tempered',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 9.9e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'AISI 430 Ferritic',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, 
      ultimateTensileStrength: 414e6, // 60 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.4e-6, // Looked up
      yieldStrength: 207e6, // 30 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH ---
    {
      name: 'AISI 446 Ferritic, Annealed',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.4e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '15-5PH Martensitic precipitation hardenable, H900',
      category: 'Stainless Steel',
      density: 7830, // 0.283 lb/in³ -> kg/m³
      youngsModulus: 197e9, // 2.85E+07 psi -> Pa (approx)
      ultimateTensileStrength: 1310e6, // 190 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.8e-6, // Looked up
      yieldStrength: 1172e6, // 170 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '15-5PH Martensitic precipitation hardenable, H1025',
      category: 'Stainless Steel',
      density: 7830, 
      youngsModulus: 197e9, 
      ultimateTensileStrength: 1069e6, // 155 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.8e-6, // Looked up
      yieldStrength: 1000e6, // 145 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '15-5PH Martensitic precipitation hardenable, H1150',
      category: 'Stainless Steel',
      density: 7830, 
      youngsModulus: 197e9, 
      ultimateTensileStrength: 931e6, // 135 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.8e-6, // Looked up
      yieldStrength: 724e6, // 105 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '17-4PH Martensitic precipitation hardenable, H900',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 197e9, // 2.85E+07 psi -> Pa (approx)
      ultimateTensileStrength: 1310e6, // 190 ksi -> Pa (approx)
      thermalExpansionCoefficient: 10.8e-6, // Looked up
      yieldStrength: 1172e6, // 170 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '17-4PH Martensitic precipitation hardenable, H1025',
      category: 'Stainless Steel',
      density: 7800, // 0.282 lb/in³ -> kg/m³
      youngsModulus: 197e9, // 2.85E+07 psi -> Pa (approx)
      ultimateTensileStrength: 1069e6, // 155 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.2e-6, // Looked up
      yieldStrength: 1000e6, // 145 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '17-4PH Martensitic precipitation hardenable, H1150',
      category: 'Stainless Steel',
      density: 7800, 
      youngsModulus: 197e9, 
      ultimateTensileStrength: 931e6, // 135 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.2e-6, // Looked up
      yieldStrength: 724e6, // 105 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '17-7PH Semiaustenitic precipitation hardenable, TH1050',
      category: 'Stainless Steel',
      density: 7640, // 0.276 lb/in³ -> kg/m³ 
      youngsModulus: 200e9, // 2.90E+07 psi -> Pa
      ultimateTensileStrength: 1220e6, // 177 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.2e-6, // Looked up
      yieldStrength: 1034e6, // 150 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 6,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'A-286 Austenitic precipitation hardenable',
      category: 'Stainless Steel', // Simplified Category
      density: 7940, // 0.287 lb/in³ -> kg/m³ 
      youngsModulus: 201e9, // 2.91E+07 psi -> Pa (approx)
      ultimateTensileStrength: 965e6, // 140 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.4e-6, // Looked up
      yieldStrength: 655e6, // 95 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Alloy 2205 Duplex Austenitic-Ferritic',
      category: 'Stainless Steel', // Simplified Category
      density: 7940, // 0.287 lb/in³ -> kg/m³ 
      youngsModulus: 197e9, // 2.85E+07 psi -> Pa (approx)
      ultimateTensileStrength: 655e6, // 95 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.7e-6, // Looked up
      yieldStrength: 448e6, // 65 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 25,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Ferrallium 255 Duplex Austenitic-Ferritic',
      category: 'Stainless Steel', // Simplified Category
      density: 7940, // 0.287 lb/in³ -> kg/m³
      youngsModulus: 197e9, // 2.85E+07 psi -> Pa (approx)
      ultimateTensileStrength: 758e6, // 110 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.0e-6, // Looked up
      yieldStrength: 552e6, // 80 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A159 Gray Cast Iron, G1800',
      category: 'Cast Iron',
      density: 7300, // 0.264 lb/in³ -> kg/m³
      youngsModulus: 81.4e9, // Avg(9.6, 14) Mpsi -> Pa
      ultimateTensileStrength: 124e6, // 18 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      poissonsRatio: 0.26,
      // --- Other fields default to null (YS, Elong not typical for Gray CI) ---
      yieldStrength: null, elongationAtBreak: null, shearModulus: null, 
      compressiveStrength: null, flexuralStrength: null, fractureToughness: null, 
      meltingPoint: null, hdt: null, maxServiceTemperature: null, fiberType: null, 
      matrixType: null
    },
    {
      name: 'ASTM A159 Gray Cast Iron, G2500',
      category: 'Cast Iron',
      density: 7300, 
      youngsModulus: 93.1e9, // Avg(12, 15) Mpsi -> Pa
      ultimateTensileStrength: 172e6, // 25 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      poissonsRatio: 0.26,
      // --- Other fields default to null ---
      yieldStrength: null, elongationAtBreak: null, shearModulus: null, 
      compressiveStrength: null, flexuralStrength: null, fractureToughness: null, 
      meltingPoint: null, hdt: null, maxServiceTemperature: null, fiberType: null, 
      matrixType: null
    },
    {
      name: 'ASTM A159 Gray Cast Iron, G3000',
      category: 'Cast Iron',
      density: 7300, 
      youngsModulus: 101.4e9, // Avg(13, 16.4) Mpsi -> Pa
      ultimateTensileStrength: 207e6, // 30 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      poissonsRatio: 0.26,
      // --- Other fields default to null ---
      yieldStrength: null, elongationAtBreak: null, shearModulus: null, 
      compressiveStrength: null, flexuralStrength: null, fractureToughness: null, 
      meltingPoint: null, hdt: null, maxServiceTemperature: null, fiberType: null, 
      matrixType: null
    },
    {
      name: 'ASTM A159 Gray Cast Iron, G3500',
      category: 'Cast Iron',
      density: 7300, 
      youngsModulus: 108.6e9, // Avg(14.5, 17) Mpsi -> Pa
      ultimateTensileStrength: 241e6, // 35 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      poissonsRatio: 0.26,
      // --- Other fields default to null ---
      yieldStrength: null, elongationAtBreak: null, shearModulus: null, 
      compressiveStrength: null, flexuralStrength: null, fractureToughness: null, 
      meltingPoint: null, hdt: null, maxServiceTemperature: null, fiberType: null, 
      matrixType: null
    },
    {
      name: 'ASTM A159 Gray Cast Iron, G4000',
      category: 'Cast Iron',
      density: 7300, // 0.264 lb/in³ -> kg/m³
      youngsModulus: 124.1e9, // Avg(16, 20) Mpsi -> Pa
      ultimateTensileStrength: 276e6, // 40 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.0e-6, // Looked up
      poissonsRatio: 0.26,
      // --- Other fields default to null (YS, Elong not typical for Gray CI) ---
      yieldStrength: null, elongationAtBreak: null, shearModulus: null, 
      compressiveStrength: null, flexuralStrength: null, fractureToughness: null, 
      meltingPoint: null, hdt: null, maxServiceTemperature: null, fiberType: null, 
      matrixType: null
    },
    {
      name: 'ASTM A536 Ductile Cast Iron, Grade 60-40-18',
      category: 'Cast Iron',
      density: 7080, // 0.256 lb/in³ -> kg/m³
      youngsModulus: 169e9, // 2.45E+07 psi -> Pa (approx)
      ultimateTensileStrength: 414e6, // 60 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.0e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 18,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A536 Ductile Cast Iron, Grade 65-45-12',
      category: 'Cast Iron',
      density: 7080, // 0.256 lb/in³ -> kg/m³
      youngsModulus: 169e9, // 2.45E+07 psi -> Pa (approx)
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.0e-6, // Looked up
      yieldStrength: 310e6, // 45 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A536 Ductile Cast Iron, Grade 80-55-06',
      category: 'Cast Iron',
      density: 7080, // 0.256 lb/in³ -> kg/m³
      youngsModulus: 169e9, // 2.45E+07 psi -> Pa (approx)
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.0e-6, // Looked up
      yieldStrength: 379e6, // 55 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 6,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'ASTM A536 Ductile Cast Iron, Grade 100-70-03',
      category: 'Cast Iron',
      density: 7080, // 0.256 lb/in³ -> kg/m³
      youngsModulus: 169e9, // 2.45E+07 psi -> Pa (approx)
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.0e-6, // Looked up
      yieldStrength: 483e6, // 70 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 3,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH ---
    {
      name: 'ASTM A536 Ductile Cast Iron, Grade 120-90-02',
      category: 'Cast Iron',
      density: 7080, // 0.256 lb/in³ -> kg/m³
      youngsModulus: 164e9, // 2.38E+07 psi -> Pa (approx)
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.0e-6, // Looked up
      yieldStrength: 621e6, // 90 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 2,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- ALUMINUM ALLOYS ---
    {
      name: 'Al 2014 T6/T651',
      category: 'Aluminum Alloy',
      density: 2790, // 0.101 lb/in³ -> kg/m³
      youngsModulus: 72.4e9, // 1.05E+07 psi -> Pa
      ultimateTensileStrength: 462e6, // 67 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.0e-6, // Looked up
      yieldStrength: 407e6, // 59 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 7,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 2024 T4',
      category: 'Aluminum Alloy',
      density: 2770, // 0.1 lb/in³ -> kg/m³
      youngsModulus: 72.4e9, // 1.05E+07 psi -> Pa
      ultimateTensileStrength: 469e6, // 62 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.2e-6, // Looked up
      yieldStrength: 324e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 5052 H32',
      category: 'Aluminum Alloy',
      density: 2680, // 0.097 lb/in³ -> kg/m³
      youngsModulus: 69.6e9, // 1.01E+07 psi -> Pa
      ultimateTensileStrength: 262e6, // 38 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.8e-6, // Looked up
      yieldStrength: 159e6, // 23 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 9,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 5083 H116/H321',
      category: 'Aluminum Alloy',
      density: 2650, // 0.096 lb/in³ -> kg/m³
      youngsModulus: 71.0e9, // 1.03E+07 psi -> Pa
      ultimateTensileStrength: 303e6, // 44 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.8e-6, // Looked up
      yieldStrength: 214e6, // 31 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Al 5083 H32', // Duplicate base, different temper
      category: 'Aluminum Alloy',
      density: 2650, // 0.096 lb/in³ -> kg/m³
      youngsModulus: 71.0e9, // 1.03E+07 psi -> Pa
      ultimateTensileStrength: 386e6, // 56 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.8e-6, // Looked up
      yieldStrength: 214e6, // 31 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 6061 T4',
      category: 'Aluminum Alloy',
      density: 2710, // 0.098 lb/in³ -> kg/m³
      youngsModulus: 68.3e9, // 9.90E+06 psi -> Pa
      ultimateTensileStrength: 179e6, // 26 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.4e-6, // Looked up
      yieldStrength: 110e6, // 16 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 16,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 6061 T6',
      category: 'Aluminum Alloy',
      density: 2710, // 0.098 lb/in³ -> kg/m³
      youngsModulus: 68.3e9, // 9.90E+06 psi -> Pa
      ultimateTensileStrength: 262e6, // 38 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.4e-6, // Looked up
      yieldStrength: 241e6, // 35 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 8,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Al 7075 T6/T651',
      category: 'Aluminum Alloy',
      density: 2790, // 0.101 lb/in³ -> kg/m³
      youngsModulus: 71.0e9, // 1.03E+07 psi -> Pa
      ultimateTensileStrength: 538e6, // 78 ksi -> Pa (approx)
      thermalExpansionCoefficient: 23.6e-6, // Looked up
      yieldStrength: 469e6, // 68 ksi -> Pa (approx)
      poissonsRatio: 0.33,
      elongationAtBreak: 6,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NICKEL ALLOYS ---
    {
      name: 'Hastelloy C-276, Solution Annealed',
      category: 'Nickel Alloy',
      density: 8890, // 0.321 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 11.2e-6, // Looked up
      yieldStrength: 283e6, // 41 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 40,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Inconel 625, Grade 1',
      category: 'Nickel Alloy',
      density: 8440, // 0.305 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 758e6, // 110 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.8e-6, // Looked up
      yieldStrength: 379e6, // 55 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 625, Grade 2',
      category: 'Nickel Alloy',
      density: 8440, // 0.305 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.8e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 686, Grade 1',
      category: 'Nickel Alloy',
      density: 8720, // 0.315 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.5e-6, // Looked up
      yieldStrength: 586e6, // 85 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 686, Grade 2',
      category: 'Nickel Alloy',
      density: 8720, // 0.315 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 931e6, // 135 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.5e-6, // Looked up
      yieldStrength: 862e6, // 125 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 686, Grade 3',
      category: 'Nickel Alloy',
      density: 8720, // 0.315 lb/in³ -> kg/m³
      youngsModulus: 205e9, // 2.98E+07 psi -> Pa
      ultimateTensileStrength: 1103e6, // 160 ksi -> Pa (approx)
      thermalExpansionCoefficient: 12.5e-6, // Looked up
      yieldStrength: 1034e6, // 150 ksi -> Pa (approx)
      poissonsRatio: 0.28,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Inconel 718, Solution Annealed & Aged',
      category: 'Nickel Alloy',
      density: 8220, // 0.297 lb/in³ -> kg/m³
      youngsModulus: 203e9, // 2.94E+07 psi -> Pa
      ultimateTensileStrength: 1034e6, // 150 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.0e-6, // Looked up
      yieldStrength: 827e6, // 120 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 718, Solution Heat Treated',
      category: 'Nickel Alloy',
      density: 8220, // 0.297 lb/in³ -> kg/m³
      youngsModulus: 203e9, // 2.94E+07 psi -> Pa
      ultimateTensileStrength: 1241e6, // 180 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.0e-6, // Looked up
      yieldStrength: 1034e6, // 150 ksi -> Pa (approx)
      poissonsRatio: 0.29,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 725, Solution Annealed',
      category: 'Nickel Alloy',
      density: 8310, // 0.300 lb/in³ -> kg/m³
      youngsModulus: 204e9, // 2.96E+07 psi -> Pa
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.3e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 45,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Inconel 725, Solution Annealed & Aged',
      category: 'Nickel Alloy',
      density: 8310, // 0.300 lb/in³ -> kg/m³
      youngsModulus: 204e9, // 2.96E+07 psi -> Pa
      ultimateTensileStrength: 1034e6, // 150 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.3e-6, // Looked up
      yieldStrength: 827e6, // 120 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Monel 400, Annealed',
      category: 'Nickel Alloy',
      density: 8830, // 0.319 lb/in³ -> kg/m³
      youngsModulus: 179e9, // 2.60E+07 psi -> Pa
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.9e-6, // Looked up
      yieldStrength: 172e6, // 25 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 35,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Monel 400, Hot Worked',
      category: 'Nickel Alloy',
      density: 8830, // 0.319 lb/in³ -> kg/m³
      youngsModulus: 179e9, // 2.60E+07 psi -> Pa
      ultimateTensileStrength: 517e6, // 75 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.9e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Monel 400, Cold Worked, Stress Relieved',
      category: 'Nickel Alloy',
      density: 8830, // 0.319 lb/in³ -> kg/m³
      youngsModulus: 179e9, // 2.60E+07 psi -> Pa
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.9e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Monel K-500, Annealed & Aged',
      category: 'Nickel Alloy',
      density: 8470, // 0.306 lb/in³ -> kg/m³
      youngsModulus: 179e9, // 2.60E+07 psi -> Pa
      ultimateTensileStrength: 896e6, // 130 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.7e-6, // Looked up
      yieldStrength: 586e6, // 85 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Monel K-500, Cold Worked & Aged',
      category: 'Nickel Alloy',
      density: 8470, // Assumed same as Annealed (was missing)
      youngsModulus: 179e9, // 2.60E+07 psi -> Pa
      ultimateTensileStrength: 965e6, // 140 ksi -> Pa (approx)
      thermalExpansionCoefficient: 13.7e-6, // Looked up
      yieldStrength: 689e6, // 100 ksi -> Pa (approx)
      poissonsRatio: 0.32, // Assumed same as Annealed (was missing)
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- COPPER ALLOYS ---
    {
      name: '70/30 Copper-Nickel, Annealed',
      category: 'Copper Alloy',
      density: 8940, // 0.323 lb/in³ -> kg/m³
      youngsModulus: 150e9, // 2.18E+07 psi -> Pa
      ultimateTensileStrength: 310e6, // 45 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.2e-6, // Looked up
      yieldStrength: 124e6, // 18 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: '70/30 Copper-Nickel, Cold Worked',
      category: 'Copper Alloy',
      density: 8940, // 0.323 lb/in³ -> kg/m³
      youngsModulus: 150e9, // 2.18E+07 psi -> Pa
      ultimateTensileStrength: 448e6, // 65 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.2e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '90/10 Copper-Nickel, Annealed',
      category: 'Copper Alloy',
      density: 8940, // 0.323 lb/in³ -> kg/m³
      youngsModulus: 140e9, // 2.03E+07 psi -> Pa
      ultimateTensileStrength: 262e6, // 38 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.3e-6, // Looked up
      yieldStrength: 103e6, // 15 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 30,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: '90/10 Copper-Nickel, Cold Worked',
      category: 'Copper Alloy',
      density: 8940, // 0.323 lb/in³ -> kg/m³
      youngsModulus: 140e9, // 2.03E+07 psi -> Pa
      ultimateTensileStrength: 345e6, // 50 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.3e-6, // Looked up
      yieldStrength: 207e6, // 30 ksi -> Pa (approx)
      poissonsRatio: 0.30,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Aluminum Bronze, Generic', // Specify alloy/condition if known
      category: 'Copper Alloy',
      density: 7450, // 0.269 lb/in³ -> kg/m³
      youngsModulus: 107e9, // 1.55E+07 psi -> Pa
      ultimateTensileStrength: 586e6, // 85 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.9e-6, // Looked up
      yieldStrength: 221e6, // 32 ksi -> Pa (approx)
      poissonsRatio: 0.316,
      elongationAtBreak: 12,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Beryllium Copper (C17200), Solution Heat Treated', // Assumed C17200
      category: 'Copper Alloy',
      density: 8250, // 0.298 lb/in³ -> kg/m³
      youngsModulus: 128e9, // 1.85E+07 psi -> Pa
      ultimateTensileStrength: 586e6, // 85 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.0e-6, // Looked up
      yieldStrength: 517e6, // 75 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 8,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Beryllium Copper (C17200), Precipitation Heat Treated', // Assumed C17200
      category: 'Copper Alloy',
      density: 8250, // 0.298 lb/in³ -> kg/m³
      youngsModulus: 128e9, // 1.85E+07 psi -> Pa
      ultimateTensileStrength: 1138e6, // 165 ksi -> Pa (approx)
      thermalExpansionCoefficient: 17.0e-6, // Looked up
      yieldStrength: 965e6, // 140 ksi -> Pa (approx)
      poissonsRatio: 0.27,
      elongationAtBreak: 3,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Nickel Aluminum Bronze (C63200), Annealed', // Assumed C63200
      category: 'Copper Alloy',
      density: 7580, // 0.274 lb/in³ -> kg/m³
      youngsModulus: 115e9, // 1.67E+07 psi -> Pa
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.2e-6, // Looked up
      yieldStrength: 234e6, // 34 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Nickel Aluminum Bronze (C63200), Quench Hardened', // Assumed C63200
      category: 'Copper Alloy',
      density: 7580, // 0.274 lb/in³ -> kg/m³
      youngsModulus: 115e9, // 1.67E+07 psi -> Pa
      ultimateTensileStrength: 621e6, // 90 ksi -> Pa (approx)
      thermalExpansionCoefficient: 16.2e-6, // Looked up
      yieldStrength: 345e6, // 50 ksi -> Pa (approx)
      poissonsRatio: 0.32,
      elongationAtBreak: 15,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- TITANIUM ALLOYS ---
    {
      name: 'Commercially Pure Titanium, Grade 2',
      category: 'Titanium Alloy',
      density: 4510, // 0.163 lb/in³ -> kg/m³
      youngsModulus: 102e9, // 1.48E+07 psi -> Pa
      ultimateTensileStrength: 345e6, // 50 ksi -> Pa (approx)
      thermalExpansionCoefficient: 8.6e-6, // Looked up
      yieldStrength: 276e6, // 40 ksi -> Pa (approx)
      poissonsRatio: 0.34,
      elongationAtBreak: 20,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Ti-5Al-2.5Sn, Annealed',
      category: 'Titanium Alloy',
      density: 4480, // 0.162 lb/in³ -> kg/m³
      youngsModulus: 107e9, // 1.55E+07 psi -> Pa
      ultimateTensileStrength: 793e6, // 115 ksi -> Pa (approx)
      thermalExpansionCoefficient: 9.4e-6, // Looked up
      yieldStrength: 758e6, // 110 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Ti-6Al-4V, Grade 5',
      category: 'Titanium Alloy',
      density: 4430, // 0.160 lb/in³ -> kg/m³
      youngsModulus: 110e9, // 1.60E+07 psi -> Pa
      ultimateTensileStrength: 896e6, // 130 ksi -> Pa (approx)
      thermalExpansionCoefficient: 8.6e-6, // Looked up
      yieldStrength: 827e6, // 120 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Ti-6Al-4V ELI, Grade 23',
      category: 'Titanium Alloy',
      density: 4430, // 0.160 lb/in³ -> kg/m³
      youngsModulus: 114e9, // 1.65E+07 psi -> Pa
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa (approx)
      thermalExpansionCoefficient: 8.6e-6, // Looked up
      yieldStrength: 758e6, // 110 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    {
      name: 'Ti-5Al-1Zr-1Mo-1V (Ti-5-1-1-1), Grade 32', // Assumed composition from name
      category: 'Titanium Alloy',
      density: 4430, // 0.160 lb/in³ -> kg/m³ 
      youngsModulus: 110e9, // 1.60E+07 psi -> Pa
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa (approx)
      thermalExpansionCoefficient: 9.0e-6, // Looked up
      yieldStrength: 586e6, // 85 ksi -> Pa (approx)
      poissonsRatio: 0.31,
      elongationAtBreak: 10,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: null, fiberType: null, matrixType: null
    },
    // ============================================================
    //                        POLYMERS
    // ============================================================
    {
      name: 'Acrylonitrile Butadiene Styrene (ABS), Moulded',
      category: 'Polymer',
      density: 1060, // Midpoint(0.35, 1.26) g/cc -> kg/m³ (Wide range noted)
      youngsModulus: 2.25e9, // Looked up typical midpoint (1.4-3.1 GPa)
      ultimateTensileStrength: 46.3e6, // Midpoint(27.6, 65) MPa -> Pa
      thermalExpansionCoefficient: 80e-6, // Looked up typical midpoint (60-100)
      yieldStrength: null,
      poissonsRatio: 0.375, // Looked up typical midpoint (0.35-0.40)
      elongationAtBreak: 56.2, // Midpoint(2.4, 110)
      maxServiceTemperature: 274, // Upper processing temp limit
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylic (PMMA), General Purpose',
      category: 'Polymer',
      density: 1180, // Midpoint(0.98, 1.2) g/cc -> kg/m³
      youngsModulus: 2.45e9, // Looked up typical midpoint (1.8-3.1 GPa)
      ultimateTensileStrength: 49.65e6, // Midpoint(19.3, 80) MPa -> Pa
      thermalExpansionCoefficient: 70e-6, // Looked up typical midpoint (50-90)
      yieldStrength: null,
      poissonsRatio: 0.375, // Looked up typical midpoint (0.35-0.40)
      elongationAtBreak: 43, // Midpoint(1.0, 85)
      maxServiceTemperature: 265, // Upper processing temp limit
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylic (PMMA), Cast',
      category: 'Polymer',
      density: 1185, // Midpoint(1.18, 1.19) g/cc -> kg/m³
      youngsModulus: 2.9e9, // Looked up typical midpoint (2.4-3.4 GPa)
      ultimateTensileStrength: 73e6, // Midpoint(62, 84) MPa -> Pa
      thermalExpansionCoefficient: 73.5e-6, // Looked up typical midpoint (70-77)
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical
      elongationAtBreak: 4.75, // Midpoint(4, 5.5)
      maxServiceTemperature: 193, // Upper processing temp limit
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polybutene-1 (PB-1)',
      category: 'Polymer',
      density: 910, // 0.91 g/cc -> kg/m³
      youngsModulus: 0.4e9, // Looked up typical midpoint (0.3-0.5 GPa)
      ultimateTensileStrength: 30.5e6, // Midpoint(27, 34) MPa -> Pa
      thermalExpansionCoefficient: 137.5e-6, // Looked up typical midpoint (125-150)
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical
      elongationAtBreak: 350, // Lower bound (>=350)
      meltingPoint: 123, // Upper melting temp limit
      maxServiceTemperature: 100, // Looked up typical service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polyamide (Nylon 6)',
      category: 'Polymer',
      density: 1140, // Looked up typical unfilled (1.13-1.15 g/cc)
      youngsModulus: 2.0e9, // Looked up typical unfilled midpoint (1.2-2.8 GPa)
      ultimateTensileStrength: 72.5e6, // Looked up typical unfilled midpoint (60-85 MPa)
      thermalExpansionCoefficient: 90e-6, // Looked up typical unfilled midpoint (80-100)
      yieldStrength: null,
      poissonsRatio: 0.39, // Looked up typical unfilled
      elongationAtBreak: 65, // Looked up typical unfilled midpoint (30-100%)
      meltingPoint: 220, // Looked up typical
      maxServiceTemperature: 150, // Looked up typical continuous service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polycarbonate (PC), Moulded',
      category: 'Polymer',
      density: 1200, // Typical unfilled (1.20 g/cc)
      youngsModulus: 2.4e9, // Looked up typical unfilled
      ultimateTensileStrength: 60e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 65e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.37, // Looked up typical unfilled
      elongationAtBreak: 110, // Looked up typical unfilled
      maxServiceTemperature: 120, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~147C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1370, // Typical unfilled (1.37 g/cc)
      youngsModulus: 3.0e9, // Looked up typical unfilled
      ultimateTensileStrength: 55e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical unfilled
      elongationAtBreak: 100, // Looked up typical unfilled (midpoint 50-150)
      meltingPoint: 260, // Looked up typical Tm
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 70-100)
      // --- Other fields default to null --- (Semi-crystalline, Tg ~75C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Styrene Acrylonitrile (SAN)',
      category: 'Polymer',
      density: 1080, // Typical unfilled (1.08 g/cc)
      youngsModulus: 3.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 70e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 70e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 3, // Looked up typical unfilled
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~110C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1070, // Typical unfilled (1.07 g/cc)
      youngsModulus: 2.3e9, // Looked up typical unfilled
      ultimateTensileStrength: 40e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 85e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical unfilled
      elongationAtBreak: 30, // Looked up typical unfilled
      maxServiceTemperature: 85, // Looked up typical continuous service temp (midpoint 80-90)
      // --- Other fields default to null --- (Amorphous, Tg ~100C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC), Flexible Grade',
      category: 'Polymer',
      density: 1500, // Midpoint(1.11, 1.89) g/cc - Highly variable
      youngsModulus: 0.1e9, // Estimated typical flexible (~0.01-1 GPa)
      ultimateTensileStrength: 15.2e6, // Midpoint(0.75, 29.7) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical flexible
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible
      elongationAtBreak: 285, // Midpoint(50, 520)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg varies <0C to ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Polyvinyl Chloride (uPVC), Sheet Grade',
      category: 'Polymer',
      density: 1410, // Midpoint(1.27, 1.55) g/cc
      youngsModulus: 3.0e9, // Looked up typical rigid PVC
      ultimateTensileStrength: 49e6, // Midpoint(46, 52) MPa
      thermalExpansionCoefficient: 60e-6, // Looked up typical rigid PVC
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical rigid PVC
      elongationAtBreak: 57.5, // Midpoint(15.0, 100)
      maxServiceTemperature: 60, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Amorphous, Tg ~80C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Expanded Polypropylene (EPP) Foam',
      category: 'Polymer',
      density: 100, // 0.1 g/cc
      youngsModulus: 0.01e9, // Estimated typical EPP foam (~10 MPa)
      ultimateTensileStrength: 1.085e6, // Midpoint(0.27, 1.9) MPa
      thermalExpansionCoefficient: 150e-6, // Estimated typical foam
      yieldStrength: null,
      poissonsRatio: 0.1, // Estimated typical low-density foam
      elongationAtBreak: 14, // Midpoint(7.0, 21.0)
      meltingPoint: 165, // Base PP melting point
      maxServiceTemperature: 90, // Looked up typical (midpoint 80-100)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polypropylene (PP), Moulded',
      category: 'Polymer',
      density: 905, // Typical unfilled homopolymer (0.90-0.91 g/cc)
      youngsModulus: 1.5e9, // Looked up typical unfilled
      ultimateTensileStrength: 35e6, // Looked up typical unfilled (30-40 MPa)
      thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical unfilled
      elongationAtBreak: 150, // Looked up typical unfilled (100-600%)
      meltingPoint: 165, // Looked up typical Tm
      maxServiceTemperature: 100, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -10C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Butyrate (CAB), 16% Plasticised',
      category: 'Polymer',
      density: 1160, // 1.16 g/cc
      youngsModulus: 1.2e9, // Looked up typical CAB
      ultimateTensileStrength: 23e6, // 23 MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical CAB
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAB
      elongationAtBreak: 50, // Lower bound (>=50)
      meltingPoint: 215, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Cellulose Acetate Propionate (CAP), 15% Plasticised',
      category: 'Polymer',
      density: 1190, // 1.19 g/cc
      youngsModulus: 1.4e9, // Looked up typical CAP
      ultimateTensileStrength: 28e6, // 28 MPa
      thermalExpansionCoefficient: 110e-6, // Looked up typical CAP
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical CAP
      elongationAtBreak: 34, // 34.00
      meltingPoint: 220, // Upper melt temp limit
      maxServiceTemperature: 70, // Looked up typical (midpoint 60-80)
      // --- Other fields default to null --- (Amorphous)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    // --- NEXT BATCH --- 
    {
      name: 'Ethylene Vinyl Acetate (EVA), Adhesive/Sealant',
      category: 'Polymer',
      density: 950, // Midpoint(0.92, 0.98) g/cc
      youngsModulus: 0.05e9, // Estimated typical flexible EVA
      ultimateTensileStrength: 14.25e6, // Midpoint(1.5, 27) MPa
      thermalExpansionCoefficient: 200e-6, // Estimated typical flexible EVA
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible EVA
      elongationAtBreak: 675, // Midpoint(50, 1300)
      maxServiceTemperature: 60, // Estimated typical continuous service temp
      // --- Other fields default to null --- (Tm varies with VA%)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Ethylene Vinyl Acetate (EVA), Moulded/Extruded',
      category: 'Polymer',
      density: 985, // Midpoint(0.92, 1.05) g/cc
      youngsModulus: 0.07e9, // Estimated typical flexible EVA
      ultimateTensileStrength: 14.45e6, // Midpoint(1.9, 27) MPa
      thermalExpansionCoefficient: 180e-6, // Estimated typical flexible EVA
      yieldStrength: null,
      poissonsRatio: 0.45, // Estimated typical flexible EVA
      elongationAtBreak: 675, // Midpoint(50, 1300)
      maxServiceTemperature: 65, // Estimated typical continuous service temp
      // --- Other fields default to null --- (Tm varies with VA%)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      fiberType: null, matrixType: null
    },
    {
      name: 'Polytetrafluoroethylene (PTFE), Extruded (Teflon®)',
      category: 'Polymer',
      density: 2150, // Midpoint(2, 2.3) g/cc
      youngsModulus: 0.5e9, // Looked up typical PTFE
      ultimateTensileStrength: 26e6, // Midpoint(18, 34) MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical PTFE
      yieldStrength: null,
      poissonsRatio: 0.46, // Looked up typical PTFE
      elongationAtBreak: 350, // Midpoint(200, 500)
      meltingPoint: 327, // Upper melt temp limit
      maxServiceTemperature: 260, // Looked up typical continuous service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Fluorinated Ethylene Propylene (FEP)',
      category: 'Polymer',
      density: 1735, // Midpoint(1.3, 2.17) g/cc
      youngsModulus: 0.5e9, // Looked up typical FEP
      ultimateTensileStrength: 23e6, // Midpoint(19, 27) MPa
      thermalExpansionCoefficient: 95e-6, // Looked up typical FEP
      yieldStrength: null,
      poissonsRatio: 0.48, // Looked up typical FEP
      elongationAtBreak: 295, // Midpoint(250, 340)
      meltingPoint: 275, // Upper melt temp limit
      maxServiceTemperature: 200, // Looked up typical continuous service temp
      // --- Other fields default to null --- 
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'High Density Polyethylene (HDPE), Sheet Grade',
      category: 'Polymer',
      density: 950, // Typical HDPE (0.95 g/cc)
      youngsModulus: 1.0e9, // Looked up typical HDPE
      ultimateTensileStrength: 27e6, // Midpoint(65, 69) MPa - High for typical HDPE?
      thermalExpansionCoefficient: 120e-6, // Looked up typical HDPE
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical HDPE
      elongationAtBreak: 1650, // Midpoint(500, 2800)
      meltingPoint: 130, // Looked up typical Tm
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Semi-crystalline, Tg ~ -120C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'High Density Polyethylene (HDPE), Homopolymer',
      category: 'Polymer',
      density: 950, // Midpoint(0.94, 0.96) g/cc
      youngsModulus: 1.0e9, // Looked up typical HDPE
      ultimateTensileStrength: 29.5e6, // Midpoint(26, 33) MPa
      thermalExpansionCoefficient: 120e-6, // Looked up typical HDPE
      yieldStrength: null,
      poissonsRatio: 0.42, // Looked up typical HDPE
      elongationAtBreak: 605, // Midpoint(10, 1200)
      meltingPoint: 130, // Looked up typical Tm
      maxServiceTemperature: 80, // Looked up typical continuous service temp
      // --- Other fields default to null --- (Processing 190-240C)
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Linear Low Density Polyethylene (LLDPE)',
      category: 'Polymer',
      density: 920, // Midpoint(0.9, 0.94) g/cc
      youngsModulus: 0.3e9, // Looked up typical LLDPE
      ultimateTensileStrength: 21.5e6, // Midpoint(8, 35) MPa
      thermalExpansionCoefficient: 180e-6, // Looked up typical LLDPE
      yieldStrength: null,
      poissonsRatio: 0.45, // Looked up typical LLDPE
      elongationAtBreak: 425, // Midpoint(50, 800)
      meltingPoint: 130, // Upper melt temp
      maxServiceTemperature: 65, // Midpoint service temp
      // --- Other fields default to null --- 
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polyamide 11 (PA11 / Nylon 11)',
      category: 'Polymer',
      density: 1040, // Midpoint(1.03, 1.05) g/cc
      youngsModulus: 1.2e9, // Looked up typical PA11
      ultimateTensileStrength: 50e6, // Midpoint(40, 60) MPa
      thermalExpansionCoefficient: 100e-6, // Looked up typical PA11
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical PA11
      elongationAtBreak: 175, // Midpoint(50, 300)
      meltingPoint: 190, // Upper melt temp
      maxServiceTemperature: 70, // Midpoint service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, hdt: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polybutylene Terephthalate (PBT)',
      category: 'Polymer',
      density: 1350, // Midpoint(1.3, 1.4) g/cc
      youngsModulus: 2.5e9, // Looked up typical PBT
      ultimateTensileStrength: 54e6, // Midpoint(48, 60) MPa
      thermalExpansionCoefficient: 70e-6, // Looked up typical PBT
      yieldStrength: null,
      poissonsRatio: 0.38, // Looked up typical PBT
      elongationAtBreak: 175, // Midpoint(50, 300)
      meltingPoint: 230, // Upper melt temp
      hdt: 65, // Midpoint HDT @ 1.8 MPa
      maxServiceTemperature: 120, // Estimated typical continuous service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    {
      name: 'Polyether Ether Ketone (PEEK)',
      category: 'Polymer',
      density: 1310, // Midpoint(1.3, 1.32) g/cc
      youngsModulus: 3.6e9, // Looked up typical PEEK
      ultimateTensileStrength: 100e6, // Midpoint(90, 110) MPa
      thermalExpansionCoefficient: 50e-6, // Looked up typical PEEK
      yieldStrength: null,
      poissonsRatio: 0.40, // Looked up typical PEEK
      elongationAtBreak: 35, // Midpoint(20, 50)
      meltingPoint: 343, // Midpoint melt temp
      hdt: 150, // Midpoint HDT @ 1.8 MPa
      maxServiceTemperature: 250, // Looked up typical continuous service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    // Add next batch of materials here...
        // --- Batch: HIPS, EPS, Polyesters, Epoxy ---
    {
          name: 'High Impact Polystyrene (HIPS)',
      category: 'Polymer',
          density: 1040, // 1.04 g/cc
          youngsModulus: 2.2e9, // Looked up typical (1.4-3.0 GPa)
          ultimateTensileStrength: 24.25e6, // Midpoint (21-27.5 MPa)
          thermalExpansionCoefficient: 80e-6, // Looked up typical (70-90)
          yieldStrength: 20e6, // Estimated slightly below UTS
          poissonsRatio: 0.35, // Looked up typical
          elongationAtBreak: 55, // Provided
          meltingPoint: null, // Amorphous, Tg ~95C
          maxServiceTemperature: 75, // Estimated typical service temp
          hdt: 102, // Provided Vicat softening point
          // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
          fractureToughness: null, fiberType: null, matrixType: null
        },
        {
          name: 'Expanded Polystyrene (EPS)',
          category: 'Polymer', // Foam
          density: 54, // Midpoint (0.008-0.1 g/cc) - Highly variable
          youngsModulus: 5e6, // Estimated typical foam (~1-10 MPa)
          ultimateTensileStrength: 0.2e6, // Estimated typical foam
          thermalExpansionCoefficient: 70e-6, // Estimated (similar to solid PS)
          yieldStrength: 0.1e6, // Estimated typical foam (compressive focus)
          poissonsRatio: 0.1, // Estimated typical foam
          elongationAtBreak: 2, // Estimated typical foam (<5%)
          meltingPoint: 240, // Provided Melt Point (base PS)
          maxServiceTemperature: 75, // Estimated typical service temp
          hdt: null,
          // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
          fractureToughness: null, fiberType: null, matrixType: null
        },
        {
          name: 'Unsaturated Polyester Resin (UPR)',
          category: 'Thermoset',
          density: 1300, // Midpoint (0.6-2 g/cc) - Highly variable (fillers)
          youngsModulus: 3e9, // Looked up typical unfilled (2-4 GPa)
          ultimateTensileStrength: 66.5e6, // Midpoint (10-123 MPa) - Highly variable
          thermalExpansionCoefficient: 80e-6, // Looked up typical unfilled (55-100)
          yieldStrength: null, // Thermoset, brittle fracture
      poissonsRatio: 0.35, // Looked up typical unfilled
          elongationAtBreak: 2, // Estimated typical unfilled (<5%)
          meltingPoint: null, // Thermoset
          maxServiceTemperature: 120, // Estimated typical service temp (lower than input range 135-280)
          hdt: null, // HDT typically ~100-150C
          // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
          fractureToughness: null, fiberType: null, matrixType: null
        },
        {
          name: 'Polyester Moulding Compound (Thermoset)', // Assumed filled/reinforced (BMC/SMC)
          category: 'Thermoset',
          density: 2000, // 2 g/cc (Likely filled)
          youngsModulus: 15e9, // Estimated typical filled (10-20 GPa)
          ultimateTensileStrength: 36e6, // Midpoint (24-48 MPa)
          thermalExpansionCoefficient: 30e-6, // Estimated typical filled (20-40)
          yieldStrength: null, // Thermoset, brittle fracture
          poissonsRatio: 0.3, // Estimated typical filled
          elongationAtBreak: 1, // Estimated typical filled (<2%)
          meltingPoint: null, // Thermoset
          maxServiceTemperature: 150, // Midpoint (135-165 C)
          hdt: null, // HDT likely near max service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
          fractureToughness: null, fiberType: null, matrixType: null
        },
        {
          name: 'Epoxy Resin (EP) (Thermoset)', // Assumed neat resin
          category: 'Thermoset',
          density: 1150, // Typical neat resin (1.1-1.2 g/cc)
          youngsModulus: 3e9, // Looked up typical neat (2.5-3.5 GPa)
          ultimateTensileStrength: 65e6, // Looked up typical neat (50-80 MPa)
          thermalExpansionCoefficient: 55e-6, // Looked up typical neat (45-65)
          yieldStrength: null, // Thermoset, often brittle
          poissonsRatio: 0.38, // Looked up typical neat (0.35-0.4)
          elongationAtBreak: 4, // Looked up typical neat (3-6%)
          meltingPoint: null, // Thermoset
          maxServiceTemperature: 170, // Upper bound from input (25-170 C)
          hdt: null, // HDT varies widely based on formulation (~50-200C+)
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
          fractureToughness: null, fiberType: null, matrixType: null
        },
        // --- End Batch ---
            // --- Batch: Epoxy Adhesive, UF/MF, Melamine-Phenolic, PF ---
    {
      name: 'Epoxy Resin (Thermoset adhesive)',
      category: 'Thermoset',
      density: 1150, // Midpoint (0.46-4.8 g/cc) - Wide range, could be filled
      youngsModulus: 2.5e9, // Looked up typical adhesive epoxy
      ultimateTensileStrength: 35.5e6, // Midpoint (1.38-69.6 MPa)
      thermalExpansionCoefficient: 60e-6, // Looked up typical epoxy
      yieldStrength: null, // Thermoset
      poissonsRatio: 0.38, // Looked up typical epoxy
      elongationAtBreak: 100, // Midpoint (0-200 %) - Wide range
      meltingPoint: null, // Thermoset
      maxServiceTemperature: 260, // Provided upper bound
      hdt: null,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    {
      name: 'Urea/Melamine Formaldehyde (UF/MF)',
      category: 'Thermoset',
      density: 1650, // Midpoint (1.5-1.8 g/cc)
      youngsModulus: 8.5e9, // Looked up typical
      ultimateTensileStrength: 50e6, // Looked up typical
      thermalExpansionCoefficient: 30e-6, // Looked up typical
      yieldStrength: null, // Thermoset, brittle
      poissonsRatio: 0.3, // Looked up typical
      elongationAtBreak: 0.8, // Looked up typical (<1%)
      meltingPoint: null, // Thermoset
      maxServiceTemperature: 120, // Looked up typical
      hdt: 120, // Looked up typical
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    {
      name: 'Melamine-Phenolic Copolymer',
      category: 'Thermoset',
      density: 1670, // 1.67 g/cc
      youngsModulus: 8e9, // Looked up typical
      ultimateTensileStrength: 59e6, // Provided
      thermalExpansionCoefficient: 40e-6, // Looked up typical
      yieldStrength: null, // Thermoset, brittle
      poissonsRatio: 0.33, // Looked up typical
      elongationAtBreak: 0.81, // Provided
      meltingPoint: null, // Thermoset
      maxServiceTemperature: 160, // Looked up typical
      hdt: 150, // Looked up typical
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    {
      name: 'Phenolic Formaldehyde Resin (PF)',
      category: 'Thermoset',
      density: 1370, // 1.37 g/cc (unfilled assumed)
      youngsModulus: 4e9, // Looked up typical unfilled
      ultimateTensileStrength: 45e6, // Looked up typical unfilled
      thermalExpansionCoefficient: 55e-6, // Looked up typical unfilled
      yieldStrength: null, // Thermoset, brittle
      poissonsRatio: 0.35, // Looked up typical unfilled
      elongationAtBreak: 0.7, // Looked up typical unfilled (<1%)
      meltingPoint: null, // Thermoset (Input 80-100C likely softening point)
      maxServiceTemperature: 170, // Looked up typical
      hdt: 150, // Looked up typical
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    // --- End Batch ---
        // --- Batch: Polyurethane Elastomer, Vinyl Ester SMC ---
    {
      name: 'Polyurethane Cast Elastomer',
      category: 'Polymer', // Elastomer
      density: 1100, // Looked up typical (1.0-1.25 g/cc)
      youngsModulus: 5e6, // Estimated typical for Shore A 70 (~3-10 MPa)
      ultimateTensileStrength: 30e6, // Estimated slightly above yield
      thermalExpansionCoefficient: 150e-6, // Looked up typical elastomer (100-200)
      yieldStrength: 26.2e6, // Provided (26.2 MPa)
      poissonsRatio: 0.49, // Looked up typical elastomer (~0.49)
      elongationAtBreak: 900, // Provided
      meltingPoint: null, // Thermoset or Amorphous Thermoplastic
      maxServiceTemperature: 82.2, // Provided
      hdt: null,
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: null, matrixType: null
    },
    {
      name: 'Vinyl Ester SMC',
      category: 'Composite', // Thermoset Matrix Composite
      density: 1490, // Midpoint (1.03-1.95 g/cc)
      youngsModulus: 14e9, // Looked up typical SMC (8-20 GPa, varies with fiber%)
      ultimateTensileStrength: 428.65e6, // Midpoint (30.3-827 MPa) - Highly variable
      thermalExpansionCoefficient: 25e-6, // Looked up typical SMC (20-30)
      yieldStrength: null, // Thermoset composite, often no distinct yield
      poissonsRatio: 0.28, // Looked up typical SMC (0.25-0.3)
      elongationAtBreak: 4.55, // Midpoint (1.2-7.9 %)
      meltingPoint: null, // Thermoset matrix
      maxServiceTemperature: 126.5, // Midpoint (93-160 C)
      hdt: null, // HDT varies but often near max service temp
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, fiberType: 'Glass (assumed)', matrixType: 'Vinyl Ester'
    },
        // --- Batch: Ceramics (Corrected - Removed thermalConductivity) ---
        {
          name: 'Porcelain',
          category: 'Ceramic',
          density: 2300, // Midpoint (2.2-2.4 g/cc)
          youngsModulus: 58.6e9, // Midpoint (7-10 Mpsi) -> Pa
          ultimateTensileStrength: 13.8e6, // Midpoint (1500-2500 psi) -> Pa
          thermalExpansionCoefficient: 5.75e-6, // Midpoint (5.0-6.5e-6 /K)
          yieldStrength: null, // Brittle
          poissonsRatio: 0.22, // Looked up typical
          elongationAtBreak: null, // Brittle
          compressiveStrength: 258.5e6, // Midpoint (25k-50k psi) -> Pa
          flexuralStrength: 32.7e6, // Midpoint (3500-6000 psi) -> Pa
          // thermalConductivity: 1.88, // REMOVED - Not in schema
          maxServiceTemperature: 400, // Provided
          // --- Other fields default to null ---
          shearModulus: null, fractureToughness: null, meltingPoint: null, hdt: null,
          fiberType: null, matrixType: null
        },
        {
          name: 'Alumina Porcelain',
          category: 'Ceramic',
          density: 3500, // Midpoint (3.1-3.9 g/cc)
          youngsModulus: 231e9, // Midpoint (15-52 Mpsi) -> Pa
          ultimateTensileStrength: 131e6, // Midpoint (8k-30k psi) -> Pa
          thermalExpansionCoefficient: 6.8e-6, // Midpoint (5.5-8.1e-6 /K)
          yieldStrength: null, // Brittle
          poissonsRatio: 0.23, // Looked up typical
          elongationAtBreak: null, // Brittle
          compressiveStrength: 113.8e6, // Midpoint (8k-25k psi) -> Pa
          flexuralStrength: 224e6, // Midpoint (20k-45k psi) -> Pa
          // thermalConductivity: 11.9, // REMOVED - Not in schema
          maxServiceTemperature: 1425, // Midpoint (1350-1500 C)
          // --- Other fields default to null ---
          shearModulus: null, fractureToughness: null, meltingPoint: null, hdt: null,
          fiberType: null, matrixType: null
        },
        {
          name: 'High-Voltage Porcelain',
          category: 'Ceramic',
          density: 2400, // Midpoint (2.3-2.5 g/cc - Assumed typo fixed)
          youngsModulus: 72.4e9, // Midpoint (7-14 Mpsi) -> Pa
          ultimateTensileStrength: 37.9e6, // Midpoint (3k-8k psi) -> Pa
          thermalExpansionCoefficient: 5.9e-6, // Midpoint (5.0-6.8e-6 /K)
          yieldStrength: null, // Brittle
          poissonsRatio: 0.22, // Looked up typical
          elongationAtBreak: null, // Brittle
          compressiveStrength: 258.5e6, // Midpoint (25k-50k psi) -> Pa
          flexuralStrength: 82.7e6, // Midpoint (9k-15k psi) -> Pa
          // thermalConductivity: 1.46, // REMOVED - Not in schema
          maxServiceTemperature: 1000, // Provided
          // --- Other fields default to null ---
          shearModulus: null, fractureToughness: null, meltingPoint: null, hdt: null,
          fiberType: null, matrixType: null
        },
        {
          name: 'Zirconia Porcelain',
          category: 'Ceramic',
          density: 3650, // Midpoint (3.5-3.8 g/cc)
          youngsModulus: 172e9, // Midpoint (20-30 Mpsi) -> Pa
          ultimateTensileStrength: 86.2e6, // Midpoint (10k-15k psi) -> Pa
          thermalExpansionCoefficient: 4.5e-6, // Midpoint (3.5-5.5e-6 /K)
          yieldStrength: null, // Brittle
          poissonsRatio: 0.28, // Looked up typical (~0.25-0.3)
          elongationAtBreak: null, // Brittle
          compressiveStrength: 793e6, // Midpoint (80k-150k psi) -> Pa
          flexuralStrength: 190e6, // Midpoint (20k-35k psi) -> Pa
          // thermalConductivity: 5.23, // REMOVED - Not in schema
          maxServiceTemperature: 1100, // Midpoint (1000-1200 C)
          // --- Other fields default to null ---
          shearModulus: null, fractureToughness: null, meltingPoint: null, hdt: null,
          fiberType: null, matrixType: null
        },
        {
          name: 'Soda–Lime Glass (Annealed)',
          category: 'Ceramic',
          density: 2400,
          youngsModulus: 7.1e10,
          ultimateTensileStrength: 4.1e7,
          thermalExpansionCoefficient: 8.8e-6,
          yieldStrength: null,
          poissonsRatio: 0.23,
          elongationAtBreak: null,
          meltingPoint: 1040,
          maxServiceTemperature: 300,
          shearModulus: 2.9e10,
          compressiveStrength: 3.3e8,
          flexuralStrength: 1.0e8,
          fractureToughness: 0.75,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Concrete, Normal Strength (30 MPa)',
          category: 'Composite',
          density: 2400,
          youngsModulus: 3.0e10,
          ultimateTensileStrength: 4.0e6,
          thermalExpansionCoefficient: 1.0e-5,
          yieldStrength: null,
          poissonsRatio: 0.20,
          elongationAtBreak: null,
          meltingPoint: null,
          maxServiceTemperature: 300,
          shearModulus: null,
          compressiveStrength: 3.0e7,
          flexuralStrength: 4.0e6,
          fractureToughness: 0.6,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Copper, Annealed (99.9% Cu)',
          category: 'Copper Alloy',
          density: 8920,
          youngsModulus: 1.2e11,
          ultimateTensileStrength: 2.1e8,
          thermalExpansionCoefficient: 17.6e-6,
          yieldStrength: 6.9e7,
          poissonsRatio: 0.34,
          elongationAtBreak: 35,
          meltingPoint: 1083,
          maxServiceTemperature: 200,
          shearModulus: 4.4e10,
          compressiveStrength: null,
          flexuralStrength: null,
          fractureToughness: 60,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Brass C26000 (70% Cu – 30% Zn), Annealed',
          category: 'Copper Alloy',
          density: 8530,
          youngsModulus: 1.17e11,
          ultimateTensileStrength: 3.03e8,
          thermalExpansionCoefficient: 19.9e-6,
          yieldStrength: null,
          poissonsRatio: 0.34,
          elongationAtBreak: 66,
          meltingPoint: 954,
          maxServiceTemperature: 200,
          shearModulus: 4.0e10,
          compressiveStrength: null,
          flexuralStrength: null,
          fractureToughness: null,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Magnesium Alloy AZ91D, Cast',
          category: 'Magnesium Alloy',
          density: 1810,
          youngsModulus: 4.6e10,
          ultimateTensileStrength: 2.0e8,
          thermalExpansionCoefficient: 2.7e-5,
          yieldStrength: 1.0e8,
          poissonsRatio: 0.29,
          elongationAtBreak: 3.0,
          meltingPoint: 600,
          maxServiceTemperature: 130,
          shearModulus: 1.8e10,
          compressiveStrength: 3.7e8,
          flexuralStrength: null,
          fractureToughness: 1.0e1,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Polyoxymethylene (POM, Acetal) Homopolymer',
          category: 'Polymer',
          density: 1410,
          youngsModulus: 3.1e9,
          ultimateTensileStrength: 7.6e7,
          thermalExpansionCoefficient: 9.0e-5,
          yieldStrength: null,
          poissonsRatio: 0.35,
          elongationAtBreak: 30,
          meltingPoint: 175,
          maxServiceTemperature: 82,
          shearModulus: null,
          compressiveStrength: 1.1e8,
          flexuralStrength: 8.9e7,
          fractureToughness: null,
          hdt: 121,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Polyamide 66 (PA66, Nylon 66), Unfilled',
          category: 'Polymer',
          density: 1140,
          youngsModulus: 3.0e9,
          ultimateTensileStrength: 7.5e7,
          thermalExpansionCoefficient: 8.1e-5,
          yieldStrength: null,
          poissonsRatio: 0.39,
          elongationAtBreak: 50,
          meltingPoint: 255,
          maxServiceTemperature: 85,
          shearModulus: null,
          compressiveStrength: null,
          flexuralStrength: 1.14e8,
          fractureToughness: null,
          hdt: 90,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'AISI 4340 Alloy Steel, Quenched & Tempered',
          category: 'Steel',
          density: 7830,
          youngsModulus: 2.10e11,
          ultimateTensileStrength: 1.05e9,
          thermalExpansionCoefficient: 1.2e-5,
          yieldStrength: 9.0e8,
          poissonsRatio: 0.30,
          elongationAtBreak: 14,
          meltingPoint: 1425,
          maxServiceTemperature: 300,
          shearModulus: 8.0e10,
          compressiveStrength: 9.0e8,
          flexuralStrength: null,
          fractureToughness: 50,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Silicone Rubber (VMQ), 50 Shore A',
          category: 'Polymer',
          density: 1100,
          youngsModulus: 5.0e6,
          ultimateTensileStrength: 5.0e6,
          thermalExpansionCoefficient: 3.0e-4,
          yieldStrength: null,
          poissonsRatio: 0.48,
          elongationAtBreak: 300,
          meltingPoint: null,
          maxServiceTemperature: 200,
          shearModulus: null,
          compressiveStrength: 2.0e7,
          flexuralStrength: null,
          fractureToughness: null,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'Tungsten Carbide (94% WC – 6% Co)',
          category: 'Ceramic',
          density: 15300,
          youngsModulus: 6.0e11,
          ultimateTensileStrength: 1.8e9,
          thermalExpansionCoefficient: 5.5e-6,
          yieldStrength: null,
          poissonsRatio: 0.22,
          elongationAtBreak: 0.5,
          meltingPoint: 1495,
          maxServiceTemperature: 500,
          shearModulus: 2.5e11,
          compressiveStrength: 4.78e9,
          flexuralStrength: 1.83e9,
          fractureToughness: 12,
          hdt: null,
          fiberType: null,
          matrixType: null
        },
        {
          name: 'FR-4 Fiberglass/Epoxy Laminate',
          category: 'Composite',
          density: 1900,
          youngsModulus: 2.2e10,
          ultimateTensileStrength: 3.1e8,
          thermalExpansionCoefficient: 1.4e-5,
          yieldStrength: null,
          poissonsRatio: 0.13,
          elongationAtBreak: 1.5,
          meltingPoint: null,
          maxServiceTemperature: 135,
          shearModulus: 1.0e10,
          compressiveStrength: null,
          flexuralStrength: 4.8e8,
          fractureToughness: null,
          hdt: 135,
          fiberType: 'Glass',
          matrixType: 'Epoxy'
        },
        {
          name: 'Reinforcing Steel (ASTM A615 Grade 60)',
          category: 'Steel',
          density: 7850,
          youngsModulus: 2.00e11,
          ultimateTensileStrength: 6.7e8,
          thermalExpansionCoefficient: 1.2e-5,
          yieldStrength: 4.2e8,
          poissonsRatio: 0.30,
          elongationAtBreak: 12,
          meltingPoint: 1500,
          maxServiceTemperature: 300,
          shearModulus: 7.7e10,
          compressiveStrength: null,
          flexuralStrength: null,
          fractureToughness: null,
          hdt: null,
          fiberType: null,
          matrixType: null
        },

            // --- Batch: Composites ---
    {
      name: 'CFRP Unidirectional (0°, 60% HM Carbon, Epoxy)',
      category: 'Composite',
      density: 1605, // 0.058 lb/in³ -> kg/m³
      youngsModulus: 138e9, // 20e6 psi -> Pa
      ultimateTensileStrength: 1517e6, // 220 ksi -> Pa
      thermalExpansionCoefficient: 0.5e-6, // Looked up typical (axial, negative or near zero)
      yieldStrength: 1517e6, // 220 ksi -> Pa
      poissonsRatio: 0.30, // Provided
      elongationAtBreak: 1.5, // Provided
      fiberType: 'High-Modulus Carbon', // Deduced from Condition
      matrixType: 'Epoxy', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 150 // Estimated typical for Epoxy
    },
    {
      name: 'CFRP Quasi-isotropic (0/±45/90, 55% HM Carbon, Epoxy)',
      category: 'Composite',
      density: 1661, // 0.060 lb/in³ -> kg/m³
      youngsModulus: 69e9, // 10e6 psi -> Pa
      ultimateTensileStrength: 827e6, // 120 ksi -> Pa
      thermalExpansionCoefficient: 3e-6, // Looked up typical (in-plane for quasi-iso)
      yieldStrength: 758e6, // 110 ksi -> Pa
      poissonsRatio: 0.30, // Provided
      elongationAtBreak: 4, // Provided
      fiberType: 'High-Modulus Carbon', // Deduced from Condition
      matrixType: 'Epoxy', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 150 // Estimated typical for Epoxy
    },
    {
      name: 'GFRP Unidirectional (0°, 55% E-Glass, Polyester/Epoxy)',
      category: 'Composite',
      density: 1799, // 0.065 lb/in³ -> kg/m³
      youngsModulus: 48e9, // 7e6 psi -> Pa
      ultimateTensileStrength: 552e6, // 80 ksi -> Pa
      thermalExpansionCoefficient: 6e-6, // Looked up typical (axial E-glass)
      yieldStrength: 552e6, // 80 ksi -> Pa
      poissonsRatio: 0.30, // Provided
      elongationAtBreak: 3, // Provided
      fiberType: 'E-Glass', // Deduced from Condition
      matrixType: 'Polyester or Epoxy', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 120 // Estimated typical for Polyester/Epoxy
    },
    {
      name: 'GFRP Quasi-isotropic (0/±45/90, 50% E-Glass, Vinyl Ester)',
      category: 'Composite',
      density: 1799, // 0.065 lb/in³ -> kg/m³
      youngsModulus: 45e9, // 6.5e6 psi -> Pa
      ultimateTensileStrength: 483e6, // 70 ksi -> Pa
      thermalExpansionCoefficient: 10e-6, // Looked up typical (in-plane for quasi-iso GFRP)
      yieldStrength: 414e6, // 60 ksi -> Pa
      poissonsRatio: 0.30, // Provided
      elongationAtBreak: 5, // Provided
      fiberType: 'E-Glass', // Deduced from Condition
      matrixType: 'Vinyl Ester', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 130 // Estimated typical for Vinyl Ester
    },
    {
      name: 'Kevlar Composite Unidirectional (0°, 55% Kevlar, Epoxy)',
      category: 'Composite',
      density: 1439, // 0.052 lb/in³ -> kg/m³
      youngsModulus: 34e9, // 5e6 psi -> Pa (Value seems low for Kevlar UD, often higher ~10-12 Msi)
      ultimateTensileStrength: 689e6, // 100 ksi -> Pa
      thermalExpansionCoefficient: -4e-6, // Looked up typical (axial, negative)
      yieldStrength: 689e6, // 100 ksi -> Pa
      poissonsRatio: 0.35, // Provided
      elongationAtBreak: 3, // Provided
      fiberType: 'Kevlar', // Deduced from Condition
      matrixType: 'Epoxy', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 150 // Estimated typical for Epoxy
    },
    {
      name: 'Hybrid Carbon/Glass Composite (Alternating, 55%, Epoxy)',
      category: 'Composite',
      density: 1661, // 0.060 lb/in³ -> kg/m³
      youngsModulus: 103e9, // 15e6 psi -> Pa
      ultimateTensileStrength: 1103e6, // 160 ksi -> Pa
      thermalExpansionCoefficient: 4e-6, // Estimated between Carbon and Glass quasi-iso
      yieldStrength: 1034e6, // 150 ksi -> Pa
      poissonsRatio: 0.32, // Provided
      elongationAtBreak: 2, // Provided
      fiberType: 'Carbon/Glass', // Deduced from Condition
      matrixType: 'Epoxy', // Deduced from Condition
      // --- Other fields default to null ---
      shearModulus: null, compressiveStrength: null, flexuralStrength: null,
      fractureToughness: null, meltingPoint: null, hdt: null,
      maxServiceTemperature: 150 // Estimated typical for Epoxy
    },
    {
      name: 'Zinc Alloy (Zamak 3)',
      category: 'Zinc Alloy',
      density: 6600,                  // kg/m³  
      youngsModulus: 9.6e10,         // Pa  
      ultimateTensileStrength: 2.68e8, // Pa  
      thermalExpansionCoefficient: 2.74e-5, // 1/°C  
      yieldStrength: 2.08e8,         // Pa  
      poissonsRatio: 0.27,           // (unitless)  
      elongationAtBreak: 10,         // %  
      meltingPoint: 387,             // °C  
      maxServiceTemperature: 100,    // °C (approx. safe operating limit)
      shearModulus: 3.8e10,          // Pa (calculated)
      compressiveStrength: 4.14e8,   // Pa  
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Tin–Lead Solder (63Sn–37Pb, Eutectic)',
      category: 'Tin Alloy',
      density: 8400,                  // kg/m³  
      youngsModulus: 3.0e10,         // Pa  
      ultimateTensileStrength: 5.17e7, // Pa  
      thermalExpansionCoefficient: 2.50e-5, // 1/°C  
      yieldStrength: 2.7e7,          // Pa  
      poissonsRatio: 0.40,           // (unitless)  
      elongationAtBreak: 37,         // %  
      meltingPoint: 183,             // °C  
      maxServiceTemperature: 145,    // °C (approx. limit before creep) 
      shearModulus: 1.07e10,         // Pa (calculated)
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Lead (99.9% Pb)',
      category: 'Lead Alloy',
      density: 11340,                // kg/m³  
      youngsModulus: 1.4e10,        // Pa 
      ultimateTensileStrength: 1.8e7, // Pa  
      thermalExpansionCoefficient: 2.91e-5, // 1/°C  
      yieldStrength: null,
      poissonsRatio: 0.42,           // (unitless)  
      elongationAtBreak: 50,         // %   (approx., very ductile)
      meltingPoint: 327,             // °C  
      maxServiceTemperature: 70,     // °C (practical continuous use limit)
      shearModulus: 4.9e9,          // Pa  
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Low Density Polyethylene (LDPE)',
      category: 'Polymer',
      density: 923,                  // kg/m³  
      youngsModulus: 2.5e8,         // Pa  
      ultimateTensileStrength: 1.0e7, // Pa  
      thermalExpansionCoefficient: 2.0e-4, // 1/°C  
      yieldStrength: null,
      poissonsRatio: 0.42,           // (unitless)  
      elongationAtBreak: 400,        // %  
      meltingPoint: 110,             // °C (melts ~105–115 °C)
      maxServiceTemperature: 50,     // °C  
      shearModulus: 8.8e7,          // Pa (calculated)
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 50,                       // °C  
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polystyrene (GPPS, General Purpose)',
      category: 'Polymer',
      density: 1070,                 // kg/m³  
      youngsModulus: 3.0e9,         // Pa  
      ultimateTensileStrength: 3.4e7, // Pa  
      thermalExpansionCoefficient: 7.0e-5, // 1/°C  
      yieldStrength: null,
      poissonsRatio: 0.35,           // (unitless)  
      elongationAtBreak: 1.6,        // %  
      meltingPoint: null,            // (amorphous, Tg ≈ 100 °C)
      maxServiceTemperature: 50,     // °C  
      shearModulus: 1.1e9,          // Pa (calculated)
      compressiveStrength: 8.0e7,    // Pa (brittle materials stronger in compression)
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 90,                       // °C 
      fiberType: null,
      matrixType: null
    },
    {
      name: 'EPDM Rubber (60 Shore A)',
      category: 'Polymer',
      density: 1120,                 // kg/m³  
      youngsModulus: 5.0e6,         // Pa  
      ultimateTensileStrength: 1.6e7, // Pa  
      thermalExpansionCoefficient: 2.0e-4, // 1/°C (typical for elastomers)
      yieldStrength: null,
      poissonsRatio: 0.49,           // (unitless) (nearly incompressible rubber)
      elongationAtBreak: 250,        // %  
      meltingPoint: null,            // (does not melt – vulcanized rubber)
      maxServiceTemperature: 140,    // °C  
      shearModulus: 2.0e6,          // Pa (calculated)
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Silicon Carbide (SiC)',
      category: 'Ceramic',
      density: 3210,                 // kg/m³ 
      youngsModulus: 4.10e11,       // Pa (range ~370–490 GPa) 
      ultimateTensileStrength: 3.0e8, // Pa (highly brittle; strong in compression) 
      thermalExpansionCoefficient: 4.0e-6, // 1/°C (very low) 
      yieldStrength: null,
      poissonsRatio: 0.17,           // (unitless) (typical for SiC)
      elongationAtBreak: null,
      meltingPoint: 2830,            // °C (decomposes) 
      maxServiceTemperature: 1500,   // °C (in air, limited by oxidation)
      shearModulus: 1.7e11,         // Pa (calculated)
      compressiveStrength: 3.0e9,    // Pa (very high crushing strength) 
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Borosilicate Glass (Pyrex)',
      category: 'Ceramic',
      density: 2230,                 // kg/m³  
      youngsModulus: 6.4e10,        // Pa  
      ultimateTensileStrength: 3.5e7, // Pa (brittle; ~35 MPa) 
      thermalExpansionCoefficient: 3.3e-6, // 1/°C  
      yieldStrength: null,
      poissonsRatio: 0.20,           // (unitless)  
      elongationAtBreak: null,
      meltingPoint: 1650,            // °C (approx. full melting point) 
      maxServiceTemperature: 500,    // °C (can withstand ~500 °C) 
      shearModulus: 2.6e10,         // Pa (calculated)
      compressiveStrength: 2.0e9,    // Pa (very high in compression) 
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Graphite (Isotropic Carbon)',
      category: 'Ceramic',
      density: 1800,                 // kg/m³  
      youngsModulus: 1.1e10,        // Pa  
      ultimateTensileStrength: 2.0e7, // Pa  
      thermalExpansionCoefficient: 4.5e-6, // 1/°C  
      yieldStrength: null,
      poissonsRatio: 0.20,           // (unitless)  
      elongationAtBreak: null,
      meltingPoint: null,            // (sublimes ~3650 °C)
      maxServiceTemperature: 500,    // °C (in air, before oxidation)
      shearModulus: 4.0e9,          // Pa (calculated)
      compressiveStrength: 8.3e7,    // Pa (e.g. ~83 MPa) 
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Structural Softwood (Pine/Douglas Fir Wood)',
      category: 'Composite',
      density: 480,                  // kg/m³  
      youngsModulus: 1.2e10,        // Pa  
      ultimateTensileStrength: 8.5e7, // Pa (along grain) 
      thermalExpansionCoefficient: 5.0e-6, // 1/°C (along grain ~3e-6, across ~20e-6)
      yieldStrength: null,
      poissonsRatio: 0.30,           // (unitless) (approx. along grain)
      elongationAtBreak: null,
      meltingPoint: null,            // (no melting; decomposes)
      maxServiceTemperature: 60,     // °C (avoid prolonged higher temps)
      shearModulus: 4.5e9,          // Pa (along grain, approx.)
      compressiveStrength: 5.0e7,    // Pa (parallel to grain) 
      flexuralStrength: 8.0e7,       // Pa (modulus of rupture)
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'High-Strength Concrete (50 MPa)',
      category: 'Composite',
      density: 2400,                 // kg/m³  
      youngsModulus: 3.5e10,        // Pa (≈35 GPa for 50 MPa concrete)
      ultimateTensileStrength: 5.2e6, 
      thermalExpansionCoefficient: 1.0e-5, // 1/°C (≈10×10⁻⁶) 
      yieldStrength: null,
      poissonsRatio: 0.20,           // (unitless)
      elongationAtBreak: null,
      meltingPoint: null,
      maxServiceTemperature: 200,    // °C (higher temps cause strength loss)
      shearModulus: 1.4e10,         // Pa (calculated)
      compressiveStrength: 5.0e7,    // Pa (design strength 50 MPa)
      flexuralStrength: 8.0e6,       // Pa (modulus of rupture)
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Stainless Steel 316 (UNS S31600)',
      category: 'Steel',
      density: 8000,                        // kg/m³
      youngsModulus: 1.93e11,              // Pa
      ultimateTensileStrength: 5.15e8,     // Pa
      thermalExpansionCoefficient: 16e-6,  // 1/°C
      yieldStrength: 2.05e8,               // Pa
      poissonsRatio: 0.27,                 // –
      elongationAtBreak: 50,               // %
      meltingPoint: 1380,                  // °C
      maxServiceTemperature: 750,          // °C
      shearModulus: 7.6e10,                // Pa
      compressiveStrength: 5.15e8,         // Pa
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Stainless Steel 304 (UNS S30400)',
      category: 'Steel',
      density: 7930,
      youngsModulus: 2.00e11,
      ultimateTensileStrength: 5.15e8,
      thermalExpansionCoefficient: 17.3e-6,
      yieldStrength: 2.05e8,
      poissonsRatio: 0.27,
      elongationAtBreak: 40,
      meltingPoint: 1425,
      maxServiceTemperature: 800,
      shearModulus: 7.9e10,
      compressiveStrength: 5.15e8,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Monel 400 (UNS N04400)',
      category: 'Nickel Alloy',
      density: 8830,
      youngsModulus: 1.79e11,
      ultimateTensileStrength: 5.17e8,
      thermalExpansionCoefficient: 14.1e-6,
      yieldStrength: 2.80e8,
      poissonsRatio: 0.32,
      elongationAtBreak: 30,
      meltingPoint: 1325,
      maxServiceTemperature: 538,
      shearModulus: 6.2e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Nickel 200 (UNS N02200)',
      category: 'Nickel Alloy',
      density: 8900,
      youngsModulus: 2.06e11,
      ultimateTensileStrength: 3.38e8,
      thermalExpansionCoefficient: 13.3e-6,
      yieldStrength: 1.27e8,
      poissonsRatio: 0.31,
      elongationAtBreak: 60,
      meltingPoint: 1455,
      maxServiceTemperature: 350,
      shearModulus: 7.9e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Hastelloy C276 (UNS N10276)',
      category: 'Nickel Alloy',
      density: 8900,
      youngsModulus: 2.05e11,
      ultimateTensileStrength: 7.90e8,
      thermalExpansionCoefficient: 11.2e-6,
      yieldStrength: 3.55e8,
      poissonsRatio: 0.33,
      elongationAtBreak: 61,
      meltingPoint: 1347,
      maxServiceTemperature: 500,
      shearModulus: 8.0e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyphenylene Sulfide (PPS)',
      category: 'Polymer',
      density: 1430,
      youngsModulus: 3.5e9,
      ultimateTensileStrength: 8.0e7,
      thermalExpansionCoefficient: 5.0e-5,
      yieldStrength: null,
      poissonsRatio: 0.35,
      elongationAtBreak: 50,
      meltingPoint: 285,
      maxServiceTemperature: 140,
      shearModulus: null,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyetherimide (PEI, Ultem)',
      category: 'Polymer',
      density: 1270,
      youngsModulus: 3.2e9,
      ultimateTensileStrength: 1.0e8,
      thermalExpansionCoefficient: 5.0e-5,
      yieldStrength: 6.0e7,
      poissonsRatio: 0.36,
      elongationAtBreak: 30,
      meltingPoint: 217,
      maxServiceTemperature: 170,
      shearModulus: null,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 160,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Magnesium Alloy AZ31B',
      category: 'Magnesium Alloy',
      density: 1770,
      youngsModulus: 4.45e10,
      ultimateTensileStrength: 2.76e8,
      thermalExpansionCoefficient: 2.4e-5,
      yieldStrength: 1.72e8,
      poissonsRatio: 0.35,
      elongationAtBreak: 12,
      meltingPoint: 595,
      maxServiceTemperature: 150,
      shearModulus: 1.65e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyvinyl Chloride (PVC, rigid)',
      category: 'Polymer',
      density: 1380,
      youngsModulus: 3.0e9,
      ultimateTensileStrength: 5.5e7,
      thermalExpansionCoefficient: 6.5e-5,
      yieldStrength: null,
      poissonsRatio: 0.38,
      elongationAtBreak: 50,
      meltingPoint: 212,
      maxServiceTemperature: 60,
      shearModulus: 1.1e9,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 75,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Malleable Cast Iron (ASTM A47 Grade 250)',
      category: 'Cast Iron',
      density: 7200,
      youngsModulus: 1.55e11,
      ultimateTensileStrength: 2.50e8,
      thermalExpansionCoefficient: 10.9e-6,
      yieldStrength: null,
      poissonsRatio: 0.26,
      elongationAtBreak: 10,
      meltingPoint: 1425,
      maxServiceTemperature: 250,
      shearModulus: 6.15e10,
      compressiveStrength: 4.00e8,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Tungsten (W), Pure',
      category: 'Metal',
      density: 19300,
      youngsModulus: 4.11e11,
      ultimateTensileStrength: 1.25e9,
      thermalExpansionCoefficient: 4.5e-6,
      yieldStrength: 7.50e8,
      poissonsRatio: 0.28,
      elongationAtBreak: 1.0,
      meltingPoint: 3422,
      maxServiceTemperature: 1000,
      shearModulus: 1.60e11,
      compressiveStrength: 1.25e9,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Aluminum Alloy 7075‑T6',
      category: 'Metal',
      density: 2810,
      youngsModulus: 71.7e9,
      ultimateTensileStrength: 572e6,
      thermalExpansionCoefficient: 23.5e-6,
      yieldStrength: 503e6,
      poissonsRatio: 0.33,
      elongationAtBreak: 11,
      meltingPoint: 477,
      maxServiceTemperature: 120,
      shearModulus: 26.9e9,
      compressiveStrength: 503e6,
      flexuralStrength: null,
      fractureToughness: 23,
      hdt: 130,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Stainless Steel 17‑4 PH H900',
      category: 'Metal',
      density: 7750,
      youngsModulus: 200e9,
      ultimateTensileStrength: 1310e6,
      thermalExpansionCoefficient: 10.8e-6,
      yieldStrength: 1172e6,
      poissonsRatio: 0.27,
      elongationAtBreak: 8,
      meltingPoint: 1425,
      maxServiceTemperature: 315,
      shearModulus: 77e9,
      compressiveStrength: 1172e6,
      flexuralStrength: null,
      fractureToughness: 35,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'AISI 1018 Mild Steel',
      category: 'Metal',
      density: 7850,
      youngsModulus: 205e9,
      ultimateTensileStrength: 440e6,
      thermalExpansionCoefficient: 12e-6,
      yieldStrength: 370e6,
      poissonsRatio: 0.29,
      elongationAtBreak: 15,
      meltingPoint: 1480,
      maxServiceTemperature: 400,
      shearModulus: 79e9,
      compressiveStrength: 440e6,
      flexuralStrength: null,
      fractureToughness: 50,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'ASTM A36 Structural Steel',
      category: 'Metal',
      density: 7850,
      youngsModulus: 200e9,
      ultimateTensileStrength: 400e6,
      thermalExpansionCoefficient: 12e-6,
      yieldStrength: 250e6,
      poissonsRatio: 0.29,
      elongationAtBreak: 20,
      meltingPoint: 1450,
      maxServiceTemperature: 350,
      shearModulus: 77e9,
      compressiveStrength: 250e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate (PET)',
      category: 'Polymer',
      density: 1380,
      youngsModulus: 3.0e9,
      ultimateTensileStrength: 55e6,
      thermalExpansionCoefficient: 70e-6,
      yieldStrength: 48e6,
      poissonsRatio: 0.37,
      elongationAtBreak: 100,
      meltingPoint: 260,
      maxServiceTemperature: 150,
      shearModulus: 1.09e9,
      compressiveStrength: 60e6,
      flexuralStrength: 80e6,
      fractureToughness: 2.5,
      hdt: 120,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polybutylene Terephthalate (PBT)',
      category: 'Polymer',
      density: 1320,
      youngsModulus: 2.3e9,
      ultimateTensileStrength: 65e6,
      thermalExpansionCoefficient: 100e-6,
      yieldStrength: 58e6,
      poissonsRatio: 0.37,
      elongationAtBreak: 50,
      meltingPoint: 223,
      maxServiceTemperature: 120,
      shearModulus: 0.84e9,
      compressiveStrength: 80e6,
      flexuralStrength: 100e6,
      fractureToughness: 2.0,
      hdt: 65,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polysulfone (PSU)',
      category: 'Polymer',
      density: 1320,
      youngsModulus: 2.8e9,
      ultimateTensileStrength: 75e6,
      thermalExpansionCoefficient: 50e-6,
      yieldStrength: 45e6,
      poissonsRatio: 0.38,
      elongationAtBreak: 30,
      meltingPoint: null,
      maxServiceTemperature: 170,
      shearModulus: null,
      compressiveStrength: 100e6,
      flexuralStrength: 120e6,
      fractureToughness: 1.5,
      hdt: 190,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Neoprene Rubber (CR, 60 Shore A)',
      category: 'Polymer',
      density: 1450,
      youngsModulus: 7.0e6,
      ultimateTensileStrength: 15e6,
      thermalExpansionCoefficient: 150e-6,
      yieldStrength: null,
      poissonsRatio: 0.49,
      elongationAtBreak: 500,
      meltingPoint: null,
      maxServiceTemperature: 80,
      shearModulus: 2.5e6,
      compressiveStrength: 10e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Nitinol (NiTi Shape Memory Alloy)',
      category: 'Metal',
      density: 6450,
      youngsModulus: 28e9,
      ultimateTensileStrength: 895e6,
      thermalExpansionCoefficient: 10e-6,
      yieldStrength: 350e6,
      poissonsRatio: 0.33,
      elongationAtBreak: 8,
      meltingPoint: 1310,
      maxServiceTemperature: 200,
      shearModulus: 14e9,
      compressiveStrength: 895e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Silicon Nitride (Si₃N₄), Sintered',
      category: 'Ceramic',
      density: 3250,
      youngsModulus: 300e9,
      ultimateTensileStrength: 300e6,
      thermalExpansionCoefficient: 3.2e-6,
      yieldStrength: null,
      poissonsRatio: 0.27,
      elongationAtBreak: null,
      meltingPoint: 1900,
      maxServiceTemperature: 1200,
      shearModulus: 130e9,
      compressiveStrength: 2.5e9,
      flexuralStrength: null,
      fractureToughness: 5.0,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Ultra‑High Molecular Weight Polyethylene (UHMWPE)',
      category: 'Polymer',
      density: 930,
      youngsModulus: 0.8e9,
      ultimateTensileStrength: 20e6,
      thermalExpansionCoefficient: 200e-6,
      yieldStrength: null,
      poissonsRatio: 0.46,
      elongationAtBreak: 300,
      meltingPoint: 135,
      maxServiceTemperature: 80,
      shearModulus: null,
      compressiveStrength: 35e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 80,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Kevlar 49/Epoxy Unidirectional Composite',
      category: 'Composite',
      density: 1560,
      youngsModulus: 80e9,
      ultimateTensileStrength: 1400e6,
      thermalExpansionCoefficient: -2e-6,
      yieldStrength: null,
      poissonsRatio: 0.35,
      elongationAtBreak: 2,
      meltingPoint: null,
      maxServiceTemperature: 150,
      shearModulus: 3e9,
      compressiveStrength: 600e6,
      flexuralStrength: 1200e6,
      fractureToughness: 30,
      hdt: null,
      fiberType: 'Kevlar 49',
      matrixType: 'Epoxy'
    },
    {
      name: 'Molybdenum, Pure',
      category: 'Metal',
      density: 10220,
      youngsModulus: 3.29e11,
      ultimateTensileStrength: 550e6,
      thermalExpansionCoefficient: 4.8e-6,
      yieldStrength: 550e6,
      poissonsRatio: 0.31,
      elongationAtBreak: 30,
      meltingPoint: 2623,
      maxServiceTemperature: 1100,
      shearModulus: 1.27e11,
      compressiveStrength: 550e6,
      flexuralStrength: null,
      fractureToughness: 120,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Tantalum, Pure',
      category: 'Metal',
      density: 16690,
      youngsModulus: 1.86e11,
      ultimateTensileStrength: 200e6,
      thermalExpansionCoefficient: 6.5e-6,
      yieldStrength: 200e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 30,
      meltingPoint: 3017,
      maxServiceTemperature: 1500,
      shearModulus: 7.2e10,
      compressiveStrength: 200e6,
      flexuralStrength: null,
      fractureToughness: 35,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Niobium, Pure',
      category: 'Metal',
      density: 8570,
      youngsModulus: 1.05e11,
      ultimateTensileStrength: 275e6,
      thermalExpansionCoefficient: 7.3e-6,
      yieldStrength: 275e6,
      poissonsRatio: 0.40,
      elongationAtBreak: 30,
      meltingPoint: 2477,
      maxServiceTemperature: 800,
      shearModulus: 4.3e10,
      compressiveStrength: 275e6,
      flexuralStrength: null,
      fractureToughness: 100,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Inconel 625 (UNS N06625)',
      category: 'Nickel Alloy',
      density: 8440,
      youngsModulus: 2.07e11,
      ultimateTensileStrength: 828e6,
      thermalExpansionCoefficient: 13.3e-6,
      yieldStrength: 414e6,
      poissonsRatio: 0.30,
      elongationAtBreak: 40,
      meltingPoint: 1350,
      maxServiceTemperature: 980,
      shearModulus: 7.5e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Maraging Steel 300 (18Ni)',
      category: 'Steel',
      density: 8100,
      youngsModulus: 2.10e11,
      ultimateTensileStrength: 2000e6,
      thermalExpansionCoefficient: 11.6e-6,
      yieldStrength: 1800e6,
      poissonsRatio: 0.30,
      elongationAtBreak: 12,
      meltingPoint: 1450,
      maxServiceTemperature: 550,
      shearModulus: 8.0e10,
      compressiveStrength: 2000e6,
      flexuralStrength: null,
      fractureToughness: 40,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Oxygen‑Free High Conductivity Copper (OFHC, C10200)',
      category: 'Copper Alloy',
      density: 8930,
      youngsModulus: 1.17e11,
      ultimateTensileStrength: 210e6,
      thermalExpansionCoefficient: 16.8e-6,
      yieldStrength: 69e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 50,
      meltingPoint: 1083,
      maxServiceTemperature: 200,
      shearModulus: 4.46e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: 60,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyvinylidene Fluoride (PVDF)',
      category: 'Polymer',
      density: 1780,
      youngsModulus: 2.0e9,
      ultimateTensileStrength: 50e6,
      thermalExpansionCoefficient: 12e-5,
      yieldStrength: 35e6,
      poissonsRatio: 0.40,
      elongationAtBreak: 20,
      meltingPoint: 177,
      maxServiceTemperature: 150,
      shearModulus: null,
      compressiveStrength: 60e6,
      flexuralStrength: 80e6,
      fractureToughness: null,
      hdt: 70,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Nitrile Butadiene Rubber (NBR, 70 Shore A)',
      category: 'Polymer',
      density: 1200,
      youngsModulus: 3.5e6,
      ultimateTensileStrength: 14e6,
      thermalExpansionCoefficient: 1.5e-4,
      yieldStrength: null,
      poissonsRatio: 0.49,
      elongationAtBreak: 400,
      meltingPoint: null,
      maxServiceTemperature: 100,
      shearModulus: 1.2e6,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Ultra‑High Performance Concrete (UHPC)',
      category: 'Composite',
      density: 2400,
      youngsModulus: 40e9,
      ultimateTensileStrength: 8e6,
      thermalExpansionCoefficient: 1.0e-5,
      yieldStrength: null,
      poissonsRatio: 0.20,
      elongationAtBreak: null,
      meltingPoint: null,
      maxServiceTemperature: 200,
      shearModulus: 15e9,
      compressiveStrength: 150e6,
      flexuralStrength: 10e6,
      fractureToughness: 5,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Cobalt‑Based Alloy MP35N',
      category: 'Metal',
      density: 8200,
      youngsModulus: 2.05e11,
      ultimateTensileStrength: 1400e6,
      thermalExpansionCoefficient: 13e-6,
      yieldStrength: 1200e6,
      poissonsRatio: 0.30,
      elongationAtBreak: 12,
      meltingPoint: 1340,
      maxServiceTemperature: 600,
      shearModulus: 7.8e10,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: 40,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'ASTM A514 T1 Quenched & Tempered Alloy Steel',
      category: 'Metal',
      density: 7850,
      youngsModulus: 205e9,
      ultimateTensileStrength: 760e6,
      thermalExpansionCoefficient: 12e-6,
      yieldStrength: 690e6,
      poissonsRatio: 0.29,
      elongationAtBreak: 11,
      meltingPoint: 1425,
      maxServiceTemperature: 400,
      shearModulus: 80e9,
      compressiveStrength: 760e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Titanium Alloy Ti‑3Al‑2.5V (Grade 9)',
      category: 'Metal',
      density: 4430,
      youngsModulus: 103e9,
      ultimateTensileStrength: 620e6,
      thermalExpansionCoefficient: 8.9e-6,
      yieldStrength: 427e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 20,
      meltingPoint: 1600,
      maxServiceTemperature: 300,
      shearModulus: 39e9,
      compressiveStrength: 620e6,
      flexuralStrength: null,
      fractureToughness: 55,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Nickel Aluminum Bronze (C63000)',
      category: 'Copper Alloy',
      density: 8400,
      youngsModulus: 117e9,
      ultimateTensileStrength: 620e6,
      thermalExpansionCoefficient: 19.5e-6,
      yieldStrength: 345e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 20,
      meltingPoint: 960,
      maxServiceTemperature: 250,
      shearModulus: 45e9,
      compressiveStrength: 620e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Brass C46400 (Naval Brass)',
      category: 'Copper Alloy',
      density: 8540,
      youngsModulus: 100e9,
      ultimateTensileStrength: 450e6,
      thermalExpansionCoefficient: 19e-6,
      yieldStrength: 300e6,
      poissonsRatio: 0.33,
      elongationAtBreak: 40,
      meltingPoint: 900,
      maxServiceTemperature: 200,
      shearModulus: 40e9,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Copper Alloy C71500 (Cu–Ni–Si)',
      category: 'Copper Alloy',
      density: 8900,
      youngsModulus: 111e9,
      ultimateTensileStrength: 690e6,
      thermalExpansionCoefficient: 17e-6,
      yieldStrength: 410e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 25,
      meltingPoint: 980,
      maxServiceTemperature: 200,
      shearModulus: 41e9,
      compressiveStrength: 690e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polypropylene (PP), Homopolymer',
      category: 'Polymer',
      density: 905,
      youngsModulus: 1.5e9,
      ultimateTensileStrength: 25e6,
      thermalExpansionCoefficient: 100e-6,
      yieldStrength: 20e6,
      poissonsRatio: 0.42,
      elongationAtBreak: 200,
      meltingPoint: 160,
      maxServiceTemperature: 80,
      shearModulus: 0.5e9,
      compressiveStrength: 40e6,
      flexuralStrength: 35e6,
      fractureToughness: 3,
      hdt: 100,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyethylene Terephthalate Glycol (PETG)',
      category: 'Polymer',
      density: 1270,
      youngsModulus: 2.2e9,
      ultimateTensileStrength: 50e6,
      thermalExpansionCoefficient: 70e-6,
      yieldStrength: 45e6,
      poissonsRatio: 0.37,
      elongationAtBreak: 50,
      meltingPoint: 250,
      maxServiceTemperature: 70,
      shearModulus: 0.8e9,
      compressiveStrength: 60e6,
      flexuralStrength: 80e6,
      fractureToughness: 2.5,
      hdt: 70,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Thermoplastic Polyurethane (TPU, Shore 85A)',
      category: 'Polymer',
      density: 1200,
      youngsModulus: 8e6,
      ultimateTensileStrength: 35e6,
      thermalExpansionCoefficient: 130e-6,
      yieldStrength: null,
      poissonsRatio: 0.49,
      elongationAtBreak: 400,
      meltingPoint: 180,
      maxServiceTemperature: 80,
      shearModulus: 2.7e6,
      compressiveStrength: 25e6,
      flexuralStrength: 20e6,
      fractureToughness: null,
      hdt: 70,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polymethylpentene (PMP, TPX)',
      category: 'Polymer',
      density: 830,
      youngsModulus: 1.1e9,
      ultimateTensileStrength: 30e6,
      thermalExpansionCoefficient: 120e-6,
      yieldStrength: 25e6,
      poissonsRatio: 0.42,
      elongationAtBreak: 200,
      meltingPoint: 235,
      maxServiceTemperature: 100,
      shearModulus: 0.4e9,
      compressiveStrength: 40e6,
      flexuralStrength: 35e6,
      fractureToughness: null,
      hdt: 80,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Mullite (3Al₂O₃·2SiO₂), Dense',
      category: 'Ceramic',
      density: 3100,
      youngsModulus: 250e9,
      ultimateTensileStrength: 30e6,
      thermalExpansionCoefficient: 5e-6,
      yieldStrength: null,
      poissonsRatio: 0.17,
      elongationAtBreak: null,
      meltingPoint: 1840,
      maxServiceTemperature: 1300,
      shearModulus: 57e9,
      compressiveStrength: 1.0e9,
      flexuralStrength: 150e6,
      fractureToughness: 3,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Cordierite (2MgO·2Al₂O₃·5SiO₂), Dense',
      category: 'Ceramic',
      density: 2600,
      youngsModulus: 170e9,
      ultimateTensileStrength: 30e6,
      thermalExpansionCoefficient: 2e-6,
      yieldStrength: null,
      poissonsRatio: 0.20,
      elongationAtBreak: null,
      meltingPoint: 1475,
      maxServiceTemperature: 1200,
      shearModulus: 39e9,
      compressiveStrength: 1.2e9,
      flexuralStrength: 100e6,
      fractureToughness: 2,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'CFRP (Carbon Fiber/Epoxy) Unidirectional, 55% Fiber',
      category: 'Composite',
      density: 1600,
      youngsModulus: 140e9,
      ultimateTensileStrength: 1500e6,
      thermalExpansionCoefficient: -1e-6,
      yieldStrength: null,
      poissonsRatio: 0.30,
      elongationAtBreak: 1.1,
      meltingPoint: null,
      maxServiceTemperature: 120,
      shearModulus: 5e9,
      compressiveStrength: 1200e6,
      flexuralStrength: 2000e6,
      fractureToughness: 25,
      hdt: null,
      fiberType: 'HM Carbon',
      matrixType: 'Epoxy'
    },
    {
      name: 'AISI 4130 Alloy Steel, Quenched & Tempered',
      category: 'Metal',
      density: 7850,
      youngsModulus: 205e9,
      ultimateTensileStrength: 560e6,
      thermalExpansionCoefficient: 12e-6,
      yieldStrength: 460e6,
      poissonsRatio: 0.29,
      elongationAtBreak: 25,
      meltingPoint: 1450,
      maxServiceTemperature: 400,
      shearModulus: null,
      compressiveStrength: 560e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'H13 Tool Steel, Quenched & Tempered',
      category: 'Metal',
      density: 7800,
      youngsModulus: 205e9,
      ultimateTensileStrength: 1900e6,
      thermalExpansionCoefficient: 11.2e-6,
      yieldStrength: 1500e6,
      poissonsRatio: 0.28,
      elongationAtBreak: 12,
      meltingPoint: 1425,
      maxServiceTemperature: 550,
      shearModulus: null,
      compressiveStrength: 1900e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Beryllium Copper (UNS C17200), Peak-Aged',
      category: 'Copper Alloy',
      density: 8250,
      youngsModulus: 128e9,
      ultimateTensileStrength: 1380e6,
      thermalExpansionCoefficient: 17.8e-6,
      yieldStrength: 965e6,
      poissonsRatio: 0.33,
      elongationAtBreak: 3,
      meltingPoint: 866,
      maxServiceTemperature: 200,
      shearModulus: null,
      compressiveStrength: 1380e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Bulk Metallic Glass (Vitreloy 1)',
      category: 'Metal',
      density: 6100,
      youngsModulus: 96e9,
      ultimateTensileStrength: 1800e6,
      thermalExpansionCoefficient: 3.2e-6,
      yieldStrength: null,
      poissonsRatio: 0.38,
      elongationAtBreak: 2,
      meltingPoint: 1000,
      maxServiceTemperature: 300,
      shearModulus: null,
      compressiveStrength: 1800e6,
      flexuralStrength: null,
      fractureToughness: 55,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyimide (Kapton®)',
      category: 'Polymer',
      density: 1420,
      youngsModulus: 2.5e9,
      ultimateTensileStrength: 231e6,
      thermalExpansionCoefficient: 20e-6,
      yieldStrength: null,
      poissonsRatio: 0.34,
      elongationAtBreak: 60,
      meltingPoint: null,
      maxServiceTemperature: 250,
      shearModulus: null,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Fused Silica (Amorphous SiO₂)',
      category: 'Ceramic',
      density: 2200,
      youngsModulus: 72e9,
      ultimateTensileStrength: 50e6,
      thermalExpansionCoefficient: 0.55e-6,
      yieldStrength: null,
      poissonsRatio: 0.17,
      elongationAtBreak: null,
      meltingPoint: 1713,
      maxServiceTemperature: 1000,
      shearModulus: null,
      compressiveStrength: 2.0e9,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Tungsten Heavy Alloy (90W–7Ni–3Fe)',
      category: 'Metal',
      density: 17000,
      youngsModulus: 345e9,
      ultimateTensileStrength: 1000e6,
      thermalExpansionCoefficient: 4.5e-6,
      yieldStrength: 700e6,
      poissonsRatio: 0.28,
      elongationAtBreak: 1,
      meltingPoint: 2800,
      maxServiceTemperature: 1000,
      shearModulus: null,
      compressiveStrength: 1000e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Inconel 718 (UNS N07718)',
      category: 'Nickel Alloy',
      density: 8190,
      youngsModulus: 208e9,
      ultimateTensileStrength: 1241e6,
      thermalExpansionCoefficient: 13e-6,
      yieldStrength: 1034e6,
      poissonsRatio: 0.30,
      elongationAtBreak: 12,
      meltingPoint: 1300,
      maxServiceTemperature: 650,
      shearModulus: null,
      compressiveStrength: 1241e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Stellite 12 (Co–Cr Alloy)',
      category: 'Metal',
      density: 8200,
      youngsModulus: 230e9,
      ultimateTensileStrength: 600e6,
      thermalExpansionCoefficient: 13e-6,
      yieldStrength: 350e6,
      poissonsRatio: 0.28,
      elongationAtBreak: 35,
      meltingPoint: 1360,
      maxServiceTemperature: 550,
      shearModulus: null,
      compressiveStrength: 600e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Acrylonitrile Butadiene Styrene (ABS)',
      category: 'Polymer',
      density: 1050,
      youngsModulus: 2.3e9,
      ultimateTensileStrength: 40e6,
      thermalExpansionCoefficient: 80e-6,
      yieldStrength: null,
      poissonsRatio: 0.35,
      elongationAtBreak: 25,
      meltingPoint: 220,
      maxServiceTemperature: 80,
      shearModulus: null,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 80,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Acrylonitrile Styrene Acrylate (ASA)',
      category: 'Polymer',
      density: 1050,
      youngsModulus: 2.3e9,
      ultimateTensileStrength: 35e6,
      thermalExpansionCoefficient: 70e-6,
      yieldStrength: null,
      poissonsRatio: 0.35,
      elongationAtBreak: 50,
      meltingPoint: 95,
      maxServiceTemperature: 80,
      shearModulus: null,
      compressiveStrength: null,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: 85,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Epoxy Resin (Generic, Cured)',
      category: 'Thermoset Polymer',
      density: 1200,
      youngsModulus: 3.0e9,
      ultimateTensileStrength: 60e6,
      thermalExpansionCoefficient: 60e-6,
      yieldStrength: null,
      poissonsRatio: 0.35,
      elongationAtBreak: 2,
      meltingPoint: null,
      maxServiceTemperature: 120,
      shearModulus: null,
      compressiveStrength: 130e6,
      flexuralStrength: 100e6,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Commercially Pure Titanium (Grade 2)',
      category: 'Metal',
      density: 4510,
      youngsModulus: 105e9,
      ultimateTensileStrength: 345e6,
      thermalExpansionCoefficient: 8.6e-6,
      yieldStrength: 275e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 20,
      meltingPoint: 1668,
      maxServiceTemperature: 400,
      shearModulus: 44e9,
      compressiveStrength: 345e6,
      flexuralStrength: null,
      fractureToughness: 55,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Stainless Steel 440C (Hardened)',
      category: 'Metal',
      density: 7780,
      youngsModulus: 200e9,
      ultimateTensileStrength: 760e6,
      thermalExpansionCoefficient: 10.2e-6,
      yieldStrength: 450e6,
      poissonsRatio: 0.27,
      elongationAtBreak: 18,
      meltingPoint: 1450,
      maxServiceTemperature: 300,
      shearModulus: 77e9,
      compressiveStrength: 760e6,
      flexuralStrength: null,
      fractureToughness: 50,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Nickel Silver (Cu–Ni–Zn, 60/20/20)',
      category: 'Copper Alloy',
      density: 8400,
      youngsModulus: 110e9,
      ultimateTensileStrength: 350e6,
      thermalExpansionCoefficient: 17e-6,
      yieldStrength: 95e6,
      poissonsRatio: 0.34,
      elongationAtBreak: 30,
      meltingPoint: 900,
      maxServiceTemperature: 150,
      shearModulus: 42e9,
      compressiveStrength: 350e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Silicon (Monocrystalline, <100>)',
      category: 'Ceramic',
      density: 2330,
      youngsModulus: 130e9,
      ultimateTensileStrength: 700e6,
      thermalExpansionCoefficient: 2.6e-6,
      yieldStrength: null,
      poissonsRatio: 0.28,
      elongationAtBreak: null,
      meltingPoint: 1410,
      maxServiceTemperature: 500,
      shearModulus: 50e9,
      compressiveStrength: 7e9,
      flexuralStrength: null,
      fractureToughness: 0.9,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Aluminum Nitride (AlN, Dense)',
      category: 'Ceramic',
      density: 3260,
      youngsModulus: 330e9,
      ultimateTensileStrength: 300e6,
      thermalExpansionCoefficient: 4.5e-6,
      yieldStrength: null,
      poissonsRatio: 0.24,
      elongationAtBreak: null,
      meltingPoint: 2200,
      maxServiceTemperature: 1000,
      shearModulus: 130e9,
      compressiveStrength: 3e9,
      flexuralStrength: 450e6,
      fractureToughness: 3,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'PZT‑5H (Lead Zirconate Titanate)',
      category: 'Ceramic',
      density: 7700,
      youngsModulus: 60e9,
      ultimateTensileStrength: 100e6,
      thermalExpansionCoefficient: 3e-6,
      yieldStrength: null,
      poissonsRatio: 0.30,
      elongationAtBreak: null,
      meltingPoint: 1200,
      maxServiceTemperature: 200,
      shearModulus: 20e9,
      compressiveStrength: 2e9,
      flexuralStrength: 60e6,
      fractureToughness: 1,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polylactic Acid (PLA)',
      category: 'Polymer',
      density: 1240,
      youngsModulus: 3.5e9,
      ultimateTensileStrength: 60e6,
      thermalExpansionCoefficient: 68e-6,
      yieldStrength: 45e6,
      poissonsRatio: 0.36,
      elongationAtBreak: 6,
      meltingPoint: 150,
      maxServiceTemperature: 50,
      shearModulus: 1.3e9,
      compressiveStrength: 60e6,
      flexuralStrength: 100e6,
      fractureToughness: 3,
      hdt: 55,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polyamide 12 (PA12)',
      category: 'Polymer',
      density: 1020,
      youngsModulus: 1.6e9,
      ultimateTensileStrength: 50e6,
      thermalExpansionCoefficient: 80e-6,
      yieldStrength: null,
      poissonsRatio: 0.40,
      elongationAtBreak: 50,
      meltingPoint: 178,
      maxServiceTemperature: 100,
      shearModulus: 0.6e9,
      compressiveStrength: 90e6,
      flexuralStrength: 100e6,
      fractureToughness: 4,
      hdt: 80,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Silver (99.9% Ag)',
      category: 'Metal',
      density: 10490,
      youngsModulus: 82e9,
      ultimateTensileStrength: 170e6,
      thermalExpansionCoefficient: 19.7e-6,
      yieldStrength: 55e6,
      poissonsRatio: 0.37,
      elongationAtBreak: 30,
      meltingPoint: 961,
      maxServiceTemperature: 200,
      shearModulus: 30e9,
      compressiveStrength: 170e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Boron Carbide (B₄C)',
      category: 'Ceramic',
      density: 2520,
      youngsModulus: 450e9,
      ultimateTensileStrength: 200e6,
      thermalExpansionCoefficient: 5e-6,
      yieldStrength: null,
      poissonsRatio: 0.17,
      elongationAtBreak: null,
      meltingPoint: 2450,
      maxServiceTemperature: 1500,
      shearModulus: 220e9,
      compressiveStrength: 20e9,
      flexuralStrength: 500e6,
      fractureToughness: 2,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Titanium Carbide (TiC)',
      category: 'Ceramic',
      density: 4960,
      youngsModulus: 440e9,
      ultimateTensileStrength: 500e6,
      thermalExpansionCoefficient: 7.4e-6,
      yieldStrength: null,
      poissonsRatio: 0.18,
      elongationAtBreak: null,
      meltingPoint: 3067,
      maxServiceTemperature: 1200,
      shearModulus: 200e9,
      compressiveStrength: 4e9,
      flexuralStrength: 3e9,
      fractureToughness: 4,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    {
      name: 'Polydimethylsiloxane (PDMS)',
      category: 'Polymer',
      density: 970,
      youngsModulus: 0.75e6,
      ultimateTensileStrength: 2e6,
      thermalExpansionCoefficient: 300e-6,
      yieldStrength: null,
      poissonsRatio: 0.50,
      elongationAtBreak: 160,
      meltingPoint: null,
      maxServiceTemperature: 150,
      shearModulus: 0.25e6,
      compressiveStrength: 1e6,
      flexuralStrength: null,
      fractureToughness: null,
      hdt: null,
      fiberType: null,
      matrixType: null
    },
    // --- End Batch ---
  ];
  // ============================================================

  console.log(`Processing ${materialsToSeed.length} materials provided for seeding.`);
  
  // Delete existing materials before seeding? Optional, but ensures clean slate.
  //console.log(`Deleting existing materials...`);
  //await prisma.material.deleteMany({}); // Use with caution!

  // Existing upsert loop will process the (currently empty) array
  for (const mat of materialsToSeed) {
    const calculatedShearModulus = calculateShearModulus(mat.youngsModulus, mat.poissonsRatio);
    const payload = createMaterialPayload(mat, calculatedShearModulus);
    
    try {
       const material = await prisma.material.upsert({
         where: { name: mat.name },
         update: payload,
         create: payload as Prisma.MaterialCreateInput,
       });
       console.log(` Upserted: ${material.name} (ID: ${material.id})`);
    } catch (error) {
       console.error(` Failed to upsert ${mat.name}:`, error);
    }
  }

  console.log(`Seeding finished.`)
}

main()
  .catch((e) => {
    console.error("Seeding script failed:")
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 