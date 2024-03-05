import { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'LegaSee',
  description: 'A memory sharing application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
