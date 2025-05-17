import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  size?: number
  text?: string
}

const LoadingSpinner = ({ 
  fullScreen = false, 
  size = 40, 
  text = 'Loading...' 
}: LoadingSpinnerProps) => {
  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[80vh]">
        <Loader2 
          size={size} 
          className="text-emerald-500 animate-spin"
        />
        <p className="mt-4 text-emerald-300 text-sm font-medium">{text}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Loader2 
        size={size} 
        className="text-emerald-500 animate-spin"
      />
      {text && <p className="mt-2 text-emerald-300 text-sm">{text}</p>}
    </div>
  )
}

export default LoadingSpinner