import Head from 'next/head'
import ChatWindow from '../components/ChatWindow'

export default function Home() {
  return (
    <div>
      <Head>
        <title>ANUVA — Demo</title>
      </Head>
      <main style={{display:'flex',justifyContent:'center',padding:'24px'}}>
        <ChatWindow />
      </main>
    </div>
  )
}
