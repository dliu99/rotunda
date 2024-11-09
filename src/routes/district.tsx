import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, FileText, Users } from "lucide-react"

const KEY = "YOUR_CONGRESS_API_KEY"
const GOOGLE_KEY = "YOUR_GOOGLE_API_KEY"

export default function DistrictPage() {
    const { address } = useParams();
    const [data, setData] = useState(null);
    const [congressData, setCongressData] = useState(null);
    const [sponsored, setSponsored] = useState(null);
    const [cosponsored, setCosponsored] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            console.log(`Address: `, [address]);
            try {
                const res = await fetch(`https://www.googleapis.com/civicinfo/v2/representatives?address=${address}&key=${GOOGLE_KEY}`);
                console.log("res", res);
                const r = await res.json();
                setData(r);
                
                const state = r.normalizedInput.state;
                const divisionKey = Object.keys(r.divisions || {}).find(key => key.match(/\/cd:/));
                console.log(r.divisions);
                const district = divisionKey ? divisionKey.split(':')[3] : null;
                
                console.log("State:", state, "District:", district);//us/state?
                
                if (state && district) {
                    fetchCongress(state, parseInt(district));
                }
            } catch (err) {
                console.error('error with fetching google api ', err);
                return (<h1>We ran into an error parsing your address -- did you type something wrong?</h1>)
            }
        };

        const fetchCongress = async (state: string, district: number) => {
            try {
                const res = await fetch(`https://api.congress.gov/v3/member/${state}/${district}?api_key=${KEY}&format=json`);
                const r = await res.json()
                const data=r.members.find(member => !("endYear" in member.terms.item[0]) && member.district === district);
                //prob not a good idea

                setCongressData(data);
                console.log(data);
                fetchLegislation(data.bioguideId)
            } catch (err) {
                console.error('error fetching congress api ', err);
            }
        };

        const fetchLegislation = async (bioguideId: string) => {
            try {
                let res = await fetch(`https://api.congress.gov/v3/member/${bioguideId}/sponsored-legislation?api_key=${KEY}&format=json`); //expects https://api.congress.gov/v3/member/XXXX?format=xml JK ignore this lol!!!!
                let data = await res.json();
                setSponsored(data)
                let res2 = await fetch(`https://api.congress.gov/v3/member/${bioguideId}/cosponsored-legislation?api_key=${KEY}&format=json`); //expects https://api.congress.gov/v3/member/XXXX?format=xml JK ignore this lol!!!!
                
                await res2.json().then(r=>setCosponsored(r));
            } catch (err) {
                console.error('error fetching legislation',err)
            }
        }

        fetchData();
    }, [address]);

    if (!data || !congressData) {
        return <div>Loading...</div>;
    }
    const office = data.offices.find(office => office.name === "U.S. Representative");
    const repIndex = office ? office.officialIndices[0] : -1;
    const repData = repIndex !== -1 ? data.officials[repIndex] : null; //google api

    return (
        <>
            <div className="container mx-auto py-8 px-4 md:px-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                    <Card className="border-transparent shadow-none">
                        <CardHeader className="flex flex-col items-center justify-center">
                        <Avatar className="w-32 h-32 mb-4">
                            <AvatarImage src={congressData?.depiction.imageUrl} alt={congressData.name} />
                            <AvatarFallback>{congressData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <CardTitle className="text-2xl mb-1">{congressData.name}</CardTitle>
                        <CardDescription className="mb-2">
                            {`${congressData.state} District ${congressData.district} • \n
                            ${congressData.terms.item[0].startYear}-Present`}
                        </CardDescription>
                        <Badge variant={congressData.partyName === "Democratic" ? "democratic" : "destructive"}>
                            {congressData.partyName}
                        </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-center">
                            <MapPin className="w-5 h-5 mr-2 text-muted-foreground" />
                            <span className="text-sm">{repData?.address?.[0]?.line1}, {repData?.address?.[0]?.city}, {repData?.address?.[0]?.state} {repData?.address?.[0]?.zip}</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="w-5 h-5 mr-2 text-muted-foreground" />
                            <span className="text-sm">{repData?.phones?.[0]}</span>
                        </div>
                        <div className="flex items-center">
                            <Mail className="w-5 h-5 mr-2 text-muted-foreground" />
                            <span className="text-sm">{repData?.emails?.[0] || "N/A"}</span>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            
                            <a target="_blank" href={repData?.urls[0]}>Visit Official Website</a>
                        </Button>
                        </CardContent>
                    </Card>

                    </div>

                    <div className="md:col-span-2 mr-10">
                    <Tabs defaultValue="sponsored">
                        <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sponsored">
                            <FileText className="w-4 h-4 mr-2" />
                            Sponsored Bills
                        </TabsTrigger>
                        <TabsTrigger value="cosponsored">
                            <Users className="w-4 h-4 mr-2" />
                            Co-sponsored Bills
                        </TabsTrigger>
                        </TabsList>
                        <TabsContent value="sponsored">
                        <Card>
                            <CardHeader>
                            <CardTitle>Recently Introduced Legislation</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <ul className="space-y-4">
                                {sponsored?.sponsoredLegislation.map((bill: object) => (
                                <li key={bill.number} className="border-b pb-4 last:border-b-0 last:pb-0">
                                    <h4 className="font-semibold">H.R. {bill.number}: {bill.title}</h4>
                                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                    <span><i>Introduced {bill.introducedDate}</i>; Last Action: {bill.latestAction?.text.split(" ")[0] || "N/A"} on {bill.latestAction?.actionDate}</span>
                                    </div>
                                </li>
                                ))}
                            </ul>
                            </CardContent>
                        </Card>
                        </TabsContent>
                        <TabsContent value="cosponsored">
                        <Card>
                            <CardHeader>
                            <CardTitle>Recently Co-sponsored Legislation</CardTitle>
                            </CardHeader>
                            <CardContent>
                            <ul className="space-y-4">
                                {cosponsored?.cosponsoredLegislation.map((bill: object) => (
                                <li key={bill.number} className="border-b pb-4 last:border-b-0 last:pb-0">
                                    <h4 className="font-semibold">{bill.title}</h4>
                                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                    
                                    <span>{bill.latestAction?.text.substring(0,bill.latestAction?.text.length-1) || "N/A"} on <strong>{bill.latestAction?.actionDate || null}</strong></span>
                                    </div>
                                </li>
                                ))}
                            </ul>
                            </CardContent>
                        </Card>
                        </TabsContent>
                    </Tabs>
                    </div>
                </div>
                </div>
        </>
    )
}
