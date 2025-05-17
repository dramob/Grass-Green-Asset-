interface QRCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  className?: string
}

/**
 * A simple QR code component that uses an external service to generate QR codes
 * This avoids having to install additional dependencies
 */
const QRCode = ({ 
  value, 
  size = 180, 
  bgColor = 'ffffff', 
  fgColor = '000000',
  className = ''
}: QRCodeProps) => {
  if (!value) return null;

  // Use a public API to generate the QR code
  // This is a simple solution that doesn't require additional dependencies
  const encodedValue = encodeURIComponent(value);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&bgcolor=${bgColor.replace('#', '')}&color=${fgColor.replace('#', '')}`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={qrCodeUrl} 
        alt="QR Code" 
        width={size} 
        height={size} 
        className="rounded-md"
        onError={(e) => {
          // If the QR code fails to load, show a placeholder
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${size} ${size}'%3E%3Crect width='${size}' height='${size}' fill='%23${bgColor.replace('#', '')}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23${fgColor.replace('#', '')}' font-size='14'%3EQR Code%3C/text%3E%3C/svg%3E`;
        }}
      />
    </div>
  );
};

export default QRCode;