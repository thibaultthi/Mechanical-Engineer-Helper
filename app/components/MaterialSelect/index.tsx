'use client'

import { useState, useEffect, useRef } from 'react'
import { Material } from '@prisma/client'

interface MaterialSelectProps {
  materials: Pick<Material, 'id' | 'name' | 'youngsModulus' | 'yieldStrength' | 'ultimateTensileStrength' | 'poissonsRatio' | 'shearModulus' | 'thermalExpansionCoefficient'>[]
  selectedMaterialId: string
  onChange: (id: string) => void
  showYoungsModulus?: boolean
  showYieldStrength?: boolean
  className?: string
}

export function MaterialSelect({
  materials,
  selectedMaterialId,
  onChange,
  showYoungsModulus = false,
  showYieldStrength = false,
  className,
}: MaterialSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId)
  
  // Convert Pa to GPa for display
  const convertToGPa = (pascals: number | null) => pascals ? pascals / 1e9 : 0
  // Convert Pa to MPa for display
  const convertToMPa = (pascals: number | null) => pascals ? pascals / 1e6 : 0

  const filteredMaterials = materials.filter((material) =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className || ''}`} ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 ${className || ''}`}
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg
            className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {selectedMaterial && (
        <div className="mt-2 text-sm">
          <div className="font-medium">{selectedMaterial.name}</div>
          {showYoungsModulus && (
            <div className="text-gray-600">
              Young's Modulus: {convertToGPa(selectedMaterial.youngsModulus).toFixed(1)} GPa
            </div>
          )}
          {showYieldStrength && (
            <div className="text-gray-600">
              Yield Strength: {convertToMPa(selectedMaterial.yieldStrength).toFixed(0)} MPa
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul
            className="max-h-60 overflow-auto rounded-md py-1 text-base"
            role="listbox"
            tabIndex={-1}
          >
            {filteredMaterials.map((material) => (
              <li
                key={material.id}
                className={`relative cursor-pointer select-none py-2 px-3 hover:bg-gray-100 ${
                  material.id === selectedMaterialId ? 'bg-primary-50 text-primary-900' : 'text-gray-900'
                }`}
                onClick={() => {
                  onChange(material.id)
                  setIsOpen(false)
                  setSearchTerm('')
                }}
                role="option"
                aria-selected={material.id === selectedMaterialId}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{material.name}</span>
                  {showYoungsModulus && (
                    <span className="text-sm text-gray-500">
                      E: {convertToGPa(material.youngsModulus).toFixed(1)} GPa
                    </span>
                  )}
                  {showYieldStrength && (
                    <span className="text-sm text-gray-500">
                      σy: {convertToMPa(material.yieldStrength).toFixed(0)} MPa
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 