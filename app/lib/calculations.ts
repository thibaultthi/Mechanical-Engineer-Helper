/**
 * Calculates the deflection of a simply supported beam under a single point load.
 * Handles both centered and off-center loads.
 * Assumes SI units (meters, Newtons, Pascals).
 *
 * @param L - Beam length (m)
 * @param P - Point load (N)
 * @param E - Young's Modulus (Pa)
 * @param I - Second Moment of Inertia (m⁴)
 * @param a - Distance from the left support (support A) to the load (m). If load is centered, a = L/2.
 * @param x - Distance from the left support (support A) where deflection is calculated (m).
 * @returns Deflection at point x (m). Positive value usually indicates downward deflection.
 */
export function calculateSimpleBeamPointLoadDeflection(
  L: number,
  P: number,
  E: number,
  I: number,
  a: number, 
  x: number
): number {
  // Basic validation
  if (E === 0 || I === 0 || L === 0) {
    return 0;
  }
  // Ensure load position is within beam span
  if (a < 0 || a > L) {
      console.error("Load position 'a' must be between 0 and L.");
      return 0; // Or throw error
  }
  // Ensure calculation point is within beam span
   if (x < 0 || x > L) {
      console.error("Calculation point 'x' must be between 0 and L.");
      return 0; // Or throw error
  }

  const b = L - a; // Distance from load to right support (support B)

  // Standard beam deflection formulas for point load P at distance 'a' from left support
  // Source: Engineering mechanics textbooks / Roark's Formulas
  
  if (x <= a) {
    // Deflection formula for x between left support and load (0 <= x <= a)
    return (P * b * x) / (6 * E * I * L) * (L*L - b*b - x*x);
  } else {
    // Deflection formula for x between load and right support (a < x <= L)
    return (P * a * (L - x)) / (6 * E * I * L) * (L*L - a*a - (L-x)*(L-x));
    // Alternative form for a < x <= L:
    // return (P * a * (L - x)) / (6 * E * I * L) * (2*L*x - x*x - a*a);
  }
}

/**
 * Calculates the maximum deflection and its location for a simply supported beam
 * under a single off-center point load.
 * Assumes SI units (meters, Newtons, Pascals).
 *
 * @param L - Beam length (m)
 * @param P - Point load (N)
 * @param E - Young's Modulus (Pa)
 * @param I - Second Moment of Inertia (m⁴)
 * @param a - Distance from the left support (support A) to the load (m).
 * @returns An object { maxDeflection: number; location: number; } where maxDeflection is in meters 
 *          and location is the distance x from the left support where it occurs (m).
 *          Returns null if inputs are invalid.
 */
export function calculateSimpleBeamMaxDeflection(
    L: number,
    P: number,
    E: number,
    I: number,
    a: number
): { maxDeflection: number; location: number; } | null {
    // Basic validation
    if (E === 0 || I === 0 || L === 0 || P === 0) {
        return { maxDeflection: 0, location: L/2 }; // Or return null if preferred
    }
    // Ensure load position is within beam span
    if (a <= 0 || a >= L) { // Use <= and >= to exclude load at supports
        console.error("Load position 'a' must be between 0 and L (exclusive).");
        return null; 
    }

    const b = L - a;
    let x_max: number;

    // Location of maximum deflection depends on whether a < b (load closer to left support)
    // Formula derived from setting the slope equation (derivative of deflection) to zero.
    if (a <= b) { 
        // If a <= L/2, max deflection occurs between left support and load (0 < x < a)
        x_max = Math.sqrt((L*L - b*b) / 3);
    } else { 
        // If a > L/2, max deflection occurs between load and right support (a < x < L)
        // The formula uses x measured from the left support A.
        x_max = L - Math.sqrt((L*L - a*a) / 3);
    }

    // Calculate the deflection at the location of maximum deflection
    const maxDeflection = calculateSimpleBeamPointLoadDeflection(L, P, E, I, a, x_max);

    return { maxDeflection, location: x_max };
}

// Keep the old function name temporarily for backward compatibility? Or update callers immediately.
// For now, let's keep the old one calling the new one for the center-load case.
/** @deprecated Use calculateSimpleBeamPointLoadDeflection instead */
export function calculateBeamDeflection(
  length: number,
  load: number,
  youngsModulus: number,
  inertia: number
): number {
    // Center load case: a = L/2, calculate deflection at x = L/2
    return calculateSimpleBeamPointLoadDeflection(length, load, youngsModulus, inertia, length / 2, length / 2);
} 