export const metadata = {
  title: 'Iconic Project Tracker',
  description: 'Construction Portfolio Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif', backgroundColor: '#FAFAFA' }}>
        {children}
      </body>
    </html>
  )
}
