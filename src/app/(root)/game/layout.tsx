export default  function GameLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ margin: 0, padding: 0, overflow: 'hidden' }} className="min-h-screen w-full h-full">
            {children}
        </div>
    )
}