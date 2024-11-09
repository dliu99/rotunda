import { useState, useEffect } from "react"
//import AsyncSelect from 'react-select/async';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useNavigate } from 'react-router-dom'

function App() {
  const [address, setAddress] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (address) {
      navigate(`/district/${address}`)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full text-center">
      <h1 className="text-4xl font-bold mb-4 font-merriweather">
        Rotunda is your{' '}
        <span className="italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
          gateway
        </span>{' '}
        to Congress
      </h1>
      <h2 className="text-lg mb-8">Stay informed about your representatives and the latest on Capitol Hill.</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex space-x-2">
        <Input 
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter an address, zip code, etc.." 
        />
        <Button type="submit" className="bg-blue-800 hover:bg-blue-950 dark:text-white">Go</Button>
      </form>
    </div>
  )
}

export default App;
