import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface SDGCheckboxProps {
  id: number
  onChange: (id: number, checked: boolean, justification: string) => void
  initialChecked?: boolean
  initialJustification?: string
}

const SDGCheckbox: React.FC<SDGCheckboxProps> = ({
  id,
  onChange,
  initialChecked = false,
  initialJustification = ''
}) => {
  const { t } = useTranslation()
  const [checked, setChecked] = useState<boolean>(initialChecked)
  const [justification, setJustification] = useState<string>(initialJustification)

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked
    setChecked(newChecked)
    onChange(id, newChecked, justification)
  }

  const handleJustificationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJustification = e.target.value
    setJustification(newJustification)
    if (checked) {
      onChange(id, checked, newJustification)
    }
  }

  return (
    <div className="border border-emerald-200/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center h-5 mt-1">
          <input
            id={`sdg-${id}`}
            type="checkbox"
            checked={checked}
            onChange={handleCheckChange}
            className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`sdg-${id}`} className="font-medium text-emerald-300">
            {id}. {t(`sell.sdg.goals.${id}.name`)}
          </label>
          <p className="text-gray-400 text-sm mt-1">
            {t(`sell.sdg.goals.${id}.description`)}
          </p>
          
          {checked && (
            <div className="mt-3">
              <label htmlFor={`justification-${id}`} className="block text-sm font-medium text-emerald-200 mb-1">
                {t('sell.form.sdgJustification')}
              </label>
              <textarea
                id={`justification-${id}`}
                value={justification}
                onChange={handleJustificationChange}
                rows={3}
                className="w-full bg-gray-800 border border-emerald-200/30 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('sell.form.sdgJustification')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SDGCheckbox