import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SDGCheckbox from './SDGCheckbox'

export interface SDGData {
  id: number
  checked: boolean
  justification: string
}

interface SDGSelectionProps {
  onChange: (sdgs: SDGData[]) => void
  initialValues?: SDGData[]
}

const SDGSelection: React.FC<SDGSelectionProps> = ({ 
  onChange,
  initialValues = []
}) => {
  const { t } = useTranslation()
  const [sdgData, setSDGData] = useState<SDGData[]>(() => {
    // Initialize with provided values or default empty values
    if (initialValues.length > 0) {
      return initialValues
    }
    
    // Create default empty array with 17 SDGs
    return Array.from({ length: 17 }, (_, i) => ({
      id: i + 1,
      checked: false,
      justification: ''
    }))
  })

  const handleSDGChange = (id: number, checked: boolean, justification: string) => {
    const newData = sdgData.map(sdg => 
      sdg.id === id ? { ...sdg, checked, justification } : sdg
    )
    setSDGData(newData)
    onChange(newData.filter(sdg => sdg.checked))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium text-emerald-300 mb-2">
        {t('sell.sdg.title')}
      </h3>
      <p className="text-gray-300 mb-4">
        {t('sell.sdg.description')}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sdgData.map(sdg => (
          <SDGCheckbox
            key={sdg.id}
            id={sdg.id}
            initialChecked={sdg.checked}
            initialJustification={sdg.justification}
            onChange={handleSDGChange}
          />
        ))}
      </div>
    </div>
  )
}

export default SDGSelection