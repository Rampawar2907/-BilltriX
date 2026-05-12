
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Party } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, UserPlus, Phone, MapPin, Search, Mail, Globe } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function PartiesPage() {
  const { parties, addParty, updateParty, deleteParty } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState<Partial<Party>>({
    name: "",
    gstin: "",
    mobileNumber: "",
    mailId: "",
    addressLine1: "",
    city: "",
    state: "",
    pin: "",
    balance: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mobileNumber) {
      toast({ variant: "destructive", title: "Required Fields", description: "Name and Mobile Number are mandatory." });
      return;
    }

    if (editingId) {
      updateParty({ id: editingId, ...formData } as Party);
      toast({ title: "Updated", description: "Party details updated." });
    } else {
      addParty({ id: Math.random().toString(36).substr(2, 9), ...formData, balance: formData.balance || 0 } as Party);
      toast({ title: "Added", description: "New party added successfully." });
    }
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", gstin: "", mobileNumber: "", mailId: "", addressLine1: "", city: "", state: "", pin: "", balance: 0 });
  };

  const filteredParties = parties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.mobileNumber.includes(searchTerm) ||
    p.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-primary">Parties List</h1>
          <p className="text-muted-foreground">Manage your relationships with customers and vendors.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-accent hover:bg-accent/90">
            <UserPlus className="w-4 h-4 mr-2" /> Add New Party
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="shadow-lg border-none animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Party</CardTitle>
            <CardDescription>Enter contact and business details for this party.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Party Name *</Label>
                  <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Business or Individual Name" required />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN (Optional)</Label>
                  <Input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} placeholder="15-digit GSTIN" />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number *</Label>
                  <Input value={formData.mobileNumber} onChange={e => setFormData({...formData, mobileNumber: e.target.value})} placeholder="10-digit number" required />
                </div>
                <div className="space-y-2">
                  <Label>Email ID</Label>
                  <Input type="email" value={formData.mailId} onChange={e => setFormData({...formData, mailId: e.target.value})} placeholder="contact@email.com" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Address</Label>
                  <Input value={formData.addressLine1} onChange={e => setFormData({...formData, addressLine1: e.target.value})} placeholder="Street, Area, Building" />
                </div>
                <div className="grid grid-cols-3 gap-2 md:col-span-2">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>PIN</Label>
                    <Input value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} />
                  </div>
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <Label>Opening Balance (₹)</Label>
                    <Input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} placeholder="0.00" />
                    <p className="text-[10px] text-muted-foreground">Use (+) for Receivable, (-) for Payable</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t pt-6">
                <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
                <Button type="submit" className="bg-primary">Save Party</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, GSTIN or phone..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>GSTIN / Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No parties found.</TableCell>
                </TableRow>
              ) : (
                filteredParties.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{p.name}</span>
                        {p.mailId && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-2 h-2" /> {p.mailId}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-1">
                        <span className="font-medium text-muted-foreground">{p.gstin || 'No GSTIN'}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.mobileNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {p.city || 'N/A'}, {p.state || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${p.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{Math.abs(p.balance).toLocaleString()} {p.balance >= 0 ? 'DR' : 'CR'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setIsAdding(true); setEditingId(p.id); setFormData(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteParty(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
