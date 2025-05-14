import { prisma } from '@/lib/db'
import MaterialsPage from './MaterialsTable'

export default async function MaterialsPageServer() {
  const initialMaterials = await prisma.material.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return <MaterialsPage initialMaterials={initialMaterials} />
} 