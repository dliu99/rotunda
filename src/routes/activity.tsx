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
const API_URL = `https://api.congress.gov/v3/bill?api_key=${API_KEY}&format=json`

interface Bill {
  congress: number
  latestAction: {
    actionDate: string
    text: string
  }
  number: string
  originChamber: string
  title: string
  type: string
  url: string
}

export default function Activity() {
  const [bills, setBills] = useState<Bill[]>([])
  const [filter, setFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [billText, setText] = useState<string>('#')
  const [summary, setSummary] = useState<any>(null)
  const [summaryExists, setExists] = useState<any>(false)
  const billsPerPage = 9

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await fetch(API_URL)
      const data = await response.json()
      setBills(data.bills)
    } catch (error) {
      console.error("Error fetching bills:", error)
    }
  }

  const fetchBillDetails = async (url: string) => {
    try {
        const response = await fetch(url+`&api_key=${API_KEY}`)
        const data = await response.json()
        setSelectedBill(data.bill)
        
        //console.log(data.bill);
        const r = await fetch(`https://api.congress.gov/v3/bill/${data.bill.congress}/hr/${data.bill.number}/text?format=json&api_key=${API_KEY}`)
        const billText = await r.json();
        console.log("Billtext",billText.textVersions)
        setText(billText.textVersions[0].formats[1].url)

        if (data.bill.summaries) {
            const r = await fetch(data.bill.summaries.url+`&api_key=${API_KEY}`)
            const summary=await r.json();
            setExists(true)
            setSummary(summary.summaries[0].text)
            
        } else {
            setSummary(null)
            setExists(false)
        }
    } catch (error) {
        console.error("Error fetching bill details:", error)
    }
  }

  const filteredBills = filter === "All" ? bills : bills.filter(bill => bill.originChamber === filter)
  const indexOfLastBill = currentPage * billsPerPage
  const indexOfFirstBill = indexOfLastBill - billsPerPage
  const currentBills = filteredBills.slice(indexOfFirstBill, indexOfLastBill)

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
      <h1 className="text-3xl font-bold mb-6">Recent Bills in Congress</h1>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          Showing {indexOfFirstBill + 1}-{Math.min(indexOfLastBill, filteredBills.length)} of {filteredBills.length} bills
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
        {currentBills.map((bill) => (
          <Card key={bill.number} className="flex flex-col">
            <CardHeader>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardTitle className="flex items-center gap-2 h-16 overflow-hidden">
                      <FileText className="min-h-7 min-w-7 flex-shrink-0" />
                      <span className="line-clamp-2">{bill.title}</span>
                    </CardTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{bill.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CardDescription>{bill.number}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{bill.latestAction.text.substring(0,bill.latestAction.text.length-1)} <i className="hover:text-black hover:underline">on {bill.latestAction.actionDate}</i></p>
              
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <Badge variant={bill.originChamber === "House" ? "default" : "secondary"}>{bill.originChamber}</Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedBill(null)
                    fetchBillDetails(bill.url)
                    }}>
                    View Summary
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  {selectedBill && (
                    <>
                      <DialogHeader>
                        <DialogTitle>{selectedBill.originChamberCode==="H" ? "H.R. " : "S. "}{selectedBill.number}: {selectedBill.title}</DialogTitle>
                        <DialogDescription>
                          Introduced by{" "}
                          <strong className={cn(getPartyColor(selectedBill?.sponsors[0]?.party))}>
                            {selectedBill?.sponsors[0]?.fullName || 'N/A'}
                          </strong>
                          {" • " + (selectedBill?.policyArea?.name || "No category given")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <p className="col-span-full" hidden={summaryExists}>No summary found :\</p>
                        <div className="col-span-full" hidden={!summaryExists}>
                    
                        {
                            summary?.split('</p>').map((paragraph: string, index: number) => {
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
                            }) || null
                        }
                    
                        </div>
                        </div>
                      </div>
                    </>
                  )}
                  <a target="_blank" className={buttonVariants({ variant: "outline" })} href={billText}><ScrollText/> View Full Bill</a>
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
          disabled={indexOfLastBill >= filteredBills.length}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
