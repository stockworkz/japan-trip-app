export default function WrappedCard({ children, className = '' }) {
  return (
    <div className={`wrapped-card ${className}`}>
      {children}
    </div>
  )
}
