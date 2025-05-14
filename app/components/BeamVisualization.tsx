'use client';

import React from 'react';

// Define shape types (can be imported if defined centrally)
export type BeamShape = 'rectangle' | 'circle' | 'direct';

interface BeamVisualizationProps {
  length: number; // Beam length in meters
  deflection: number; // Max deflection in meters
  shape: BeamShape;
  base?: number; // Base in meters (for rectangle)
  height?: number; // Height in meters (for rectangle)
  diameter?: number; // Diameter in meters (for circle)
  svgWidth?: number;
  svgHeight?: number;
}

export function BeamVisualization({
  length,
  deflection,
  shape,
  base,
  height,
  diameter,
  svgWidth = 400,
  svgHeight = 100,
}: BeamVisualizationProps) {
  if (length <= 0 || deflection === null || deflection === undefined) {
    return null; // Don't render if data is invalid
  }

  // --- SVG Coordinate System Setup ---
  const padding = 20;
  const beamVisualLength = svgWidth - 2 * padding; // Length of the beam line in SVG units
  const beamY = svgHeight / 2; // Y position of the undeflected beam

  // --- Deflection Scaling ---
  // Exaggerate deflection for visibility. Max visual deflection is 40% of available height.
  const maxVisualDeflection = (svgHeight / 2 - padding) * 0.8;
  const scaleFactor = length > 0 ? beamVisualLength / length : 1;

  // Calculate visual deflection, ensuring it doesn't exceed the max allowed
  // Use absolute deflection as the curve is always downwards in this simple case
  let visualDeflection = Math.abs(deflection) * scaleFactor; 
  visualDeflection = Math.min(visualDeflection, maxVisualDeflection);

  // --- Path Data ---
  // Use a quadratic Bezier curve: M start Q control end
  // Start: (padding, beamY)
  // End: (svgWidth - padding, beamY)
  // Control point: (svgWidth / 2, beamY + visualDeflection)
  const pathData = `M ${padding},${beamY} Q ${svgWidth / 2},${beamY + visualDeflection} ${svgWidth - padding},${beamY}`;

  // --- Cross-Section Visualization Logic ---
  const sectionSvgSize = 50; // Size of the square viewport for the section
  const sectionPadding = 5;
  let sectionElement = null;

  // Determine the largest dimension for scaling the section view
  let maxDim = 0;
  if (shape === 'rectangle' && base && height) {
    maxDim = Math.max(base, height);
  } else if (shape === 'circle' && diameter) {
    maxDim = diameter;
  }

  if (maxDim > 0) {
    const scale = (sectionSvgSize - 2 * sectionPadding) / maxDim;
    const transform = `translate(${sectionSvgSize / 2}, ${sectionSvgSize / 2}) scale(${scale}) translate(${-sectionSvgSize / 2}, ${-sectionSvgSize / 2})`;

    if (shape === 'rectangle' && base && height) {
      const rectWidth = base;
      const rectHeight = height;
      sectionElement = (
        <svg width={sectionSvgSize} height={sectionSvgSize} viewBox={`0 0 ${sectionSvgSize} ${sectionSvgSize}`} className="ml-4 border rounded bg-gray-100">
          <g transform={transform}>
            <rect
              x={(sectionSvgSize - rectWidth) / 2}
              y={(sectionSvgSize - rectHeight) / 2}
              width={rectWidth}
              height={rectHeight}
              fill="none"
              stroke="#6b7280" /* gray-500 */
              strokeWidth={1 / scale} // Adjust stroke width based on scale
            />
          </g>
        </svg>
      );
    } else if (shape === 'circle' && diameter) {
      const radius = diameter / 2;
       sectionElement = (
        <svg width={sectionSvgSize} height={sectionSvgSize} viewBox={`0 0 ${sectionSvgSize} ${sectionSvgSize}`} className="ml-4 border rounded bg-gray-100">
           <g transform={transform}>
            <circle
              cx={sectionSvgSize / 2}
              cy={sectionSvgSize / 2}
              r={radius}
              fill="none"
              stroke="#6b7280" /* gray-500 */
              strokeWidth={1 / scale}
            />
          </g>
        </svg>
      );
    }
  }

  return (
    <div className="my-4 border rounded-md p-4 bg-gray-50 flex items-center">
      {/* Deflection SVG (Main Visualization) */}
      <div className="flex-grow">
        <h3 className="text-center text-sm font-medium text-gray-600 mb-2">Beam Deflection Visualized (Exaggerated)</h3>
        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
           {/* Undeflected Beam */}
           <line
             x1={padding}
             y1={beamY}
             x2={svgWidth - padding}
             y2={beamY}
             stroke="#9ca3af" /* gray-400 */
             strokeWidth="2"
             strokeDasharray="4 2" /* Dashed line */
           />
           
           {/* Supports (simple triangles) */}
           <polygon points={`${padding-5},${beamY+10} ${padding},${beamY} ${padding+5},${beamY+10}`} fill="#6b7280" /* gray-500 */ />
           <polygon points={`${svgWidth - padding - 5},${beamY+10} ${svgWidth - padding},${beamY} ${svgWidth - padding + 5},${beamY+10}`} fill="#6b7280" /* gray-500 */ />

           {/* Deflected Beam */}
           {visualDeflection > 0 && (
             <path
               d={pathData}
               stroke="#0ea5e9" /* sky-500 */
               strokeWidth="3"
               fill="none"
             />
           )}
           
           {/* Max Deflection Arrow & Text (Optional) */}
           {visualDeflection > 5 && ( // Only show if visually significant
             <>
               <line
                   x1={svgWidth / 2}
                   y1={beamY}
                   x2={svgWidth / 2}
                   y2={beamY + visualDeflection - 2} // End slightly above curve
                   stroke="#ef4444" /* red-500 */
                   strokeWidth="1"
                   markerEnd="url(#arrowhead)"
                />
                <defs>
                 <marker id="arrowhead" markerWidth="5" markerHeight="3.5" refX="0" refY="1.75" orient="auto">
                   <polygon points="0 0, 5 1.75, 0 3.5" fill="#ef4444" />
                 </marker>
               </defs>
               <text 
                 x={svgWidth / 2 + 5} 
                 y={beamY + visualDeflection + 5} // Adjusted Y: Move below the curve + add padding
                 fontSize="10" 
                 fill="#ef4444"
                 alignmentBaseline="middle">
                   {(deflection * 1000).toFixed(2)} mm
                </text>
             </>
           )}
        </svg>
      </div>
      {/* Cross-Section Visualization */}
      {sectionElement && (
        <div className="flex-shrink-0">
            <h4 className="text-center text-xs font-medium text-gray-600 mb-1">Section</h4>
            {sectionElement}
        </div>
      )}
    </div>
  );
} 