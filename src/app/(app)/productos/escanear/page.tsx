import { Header } from '@/components/layout/Header'
import { TicketScanner } from './TicketScanner'

export default function EscanearPage() {
  return (
    <>
      <Header title="Escanear ticket" back />
      <TicketScanner />
    </>
  )
}
