import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, FileText, ScrollText } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const API_KEY = "YOUR_CONGRESS_API_KEY"
const API_URL = `https://api.congress.gov/v3/law/118?api_key=${API_KEY}&format=json`

interface Law {
  congress: number
  latestAction: {
    actionDate: string
    text: string
  }
  number: string
  originChamber: string
  originChamberCode: string
  title: string
  type: string
  url: string
  laws: Array<{ number: string, type: string }>
}

export default function Laws() {
  const [laws, setLaws] = useState<Law[]>([])
  const [filter, setFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedLaw, setSelectedLaw] = useState<any>(null)
  const [lawText, setLawText] = useState<string>('#')
  const [summary, setSummary] = useState<any>(null)
  const [summaryExists, setExists] = useState<boolean>(false)
  const lawsPerPage = 9

  useEffect(() => {
    fetchLaws()
  }, [])

  const fetchLaws = async () => {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      setLaws(data.bills)
    } catch (error) {
      console.error("Error fetching laws:", error)
    }
  }

  const fetchLawDetails = async (url: string) => {
    try {
      const response = await fetch(url+`&api_key=${API_KEY}`)
      const data = await response.json()
      setSelectedLaw(data.bill)
      
      const r = await fetch(`https://api.congress.gov/v3/bill/${data.bill.congress}/${data.bill.originChamberCode.toLowerCase()}/${data.bill.number}/text?format=json&api_key=${API_KEY}`)
      const billText = await r.json();
      console.log("law text",billText.textVersions)
      setLawText(billText.textVersions[0].formats[1].url)

      if (data.bill.summaries) {
        const r = await fetch(data.bill.summaries.url+`&api_key=${API_KEY}`)
        const summaryData = await r.json()
        setExists(true)
        setSummary(summaryData.summaries[0].text)
      } else {
        setSummary(null)
        setExists(false)
      }
    } catch (error) {
      console.error("Error fetching law details:", error)
    }
  }

  const filteredLaws = filter === "All" ? laws : laws.filter(law => law.originChamber === filter)
  const indexOfLastLaw = currentPage * lawsPerPage
  const indexOfFirstLaw = indexOfLastLaw - lawsPerPage
  const currentLaws = filteredLaws.slice(indexOfFirstLaw, indexOfLastLaw)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const getPartyColor = (party: string) => {
    switch (party) {
      case "R":
        return "text-red-600"
      case "D":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="container mx-auto p-12">
      <h1 className="text-3xl font-bold mb-6">Recently Passed Laws</h1>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Showing {indexOfFirstLaw + 1}-{Math.min(indexOfLastLaw, filteredLaws.length)} of {filteredLaws.length} laws
        </p>
        <Select onValueChange={(value) => { setFilter(value); setCurrentPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Chamber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Chambers</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="Senate">Senate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentLaws.map((law) => (
          <Card key={law.number} className="flex flex-col">
            <CardHeader>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="flex items-center gap-2 h-16 overflow-hidden">
                      <FileText className="min-h-7 min-w-7 flex-shrink-0" />
                      <span className="line-clamp-2">{law.title}</span>
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{law.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CardDescription>{law.type}. {law.number}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {law.latestAction.text.substring(0,law.latestAction.text.length-1)} <i className="hover:text-black hover:underline">on {law.latestAction.actionDate}</i>
              </p>

            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Badge variant={law.originChamber === "House" ? "default" : "secondary"}>{law.originChamber}</Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedLaw(null)
                    fetchLawDetails(law.url)
                  }}>
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  {selectedLaw && (
                    <>
                      <DialogHeader>
                        <DialogTitle>{selectedLaw.type} {selectedLaw.number}: {selectedLaw.title}</DialogTitle>
                        <DialogDescription>
                          Introduced by{" "}
                          <strong className={cn(getPartyColor(selectedLaw?.sponsors?.[0]?.party))}>
                            {selectedLaw?.sponsors?.[0]?.fullName || 'N/A'}
                          </strong>
                          {" • " + (selectedLaw?.policyArea?.name || "No category given")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <p className="col-span-full" hidden={summaryExists}>No summary found :\</p>
                          <div className="col-span-full" hidden={!summaryExists}>
                            {summary?.split('</p>').map((paragraph: string, index: number) => {
                              if (!paragraph.trim()) return null;
                              
                              const cleanText = paragraph
                                .replace(/<p>/g, '')
                                .replace(/<(\/?)strong>/g, '**')
                                .replace(/<ul>/g, '\n')
                                .replace(/<\/ul>/g, '\n')
                                .replace(/<li>/g, '• ')
                                .replace(/<\/li>/g, '\n')
                                .replace(/<!--[\s\S]*?-->/g, '')
                                .replace(/<\/?[a-z][^>]*>/gi, '')
                                .replace(/<br\s*\/?>/gi, '\n\n')
                                .trim()
                                .split(/\n{3,}/)
                                .join('\n\n');

                              return (
                                <p key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: '1em' }}>
                                  {cleanText}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <a target="_blank" className={buttonVariants({ variant: "outline" })} href={lawText || '#'}>
                    <ScrollText/> View Full Law Text
                  </a>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="flex justify-center mt-6 gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => paginate(currentPage + 1)}
          disabled={indexOfLastLaw >= filteredLaws.length}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
