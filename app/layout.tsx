export const metadata = {
  title: 'Iconic Project Intelligence · Acres Foundation',
  description: 'AI-Powered Construction Portfolio Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0A0A0F' }}>
        {children}
      </body>
    </html>
  )
}
