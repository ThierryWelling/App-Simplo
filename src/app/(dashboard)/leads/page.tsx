'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Download, Search, Filter, Trash2, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import * as XLSX from 'xlsx'

interface Lead {
  id: string
  created_at: string
  landing_page_id: string
  data: Record<string, any>
  landing_page?: {
    title: string
    slug: string
  }
}

interface LandingPage {
  id: string
  title: string
  slug: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [selectedLandingPage, setSelectedLandingPage] = useState<string | null>(null)

  // Carregar leads e landing pages
  useEffect(() => {
    loadData()
  }, [])

  // Filtrar leads quando o usuário pesquisa ou seleciona uma landing page
  useEffect(() => {
    filterLeads()
  }, [searchQuery, selectedLandingPage, leads])

  async function loadData() {
    setIsLoading(true)
    try {
      // Carregar leads com informações da landing page
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          landing_page:landing_pages(id, title, slug)
        `)
        .order('created_at', { ascending: false })

      if (leadsError) throw leadsError

      // Carregar todas as landing pages para o filtro
      const { data: landingPagesData, error: landingPagesError } = await supabase
        .from('landing_pages')
        .select('id, title, slug')
        .order('title')

      if (landingPagesError) throw landingPagesError

      setLeads(leadsData || [])
      setFilteredLeads(leadsData || [])
      setLandingPages(landingPagesData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterLeads() {
    let filtered = [...leads]

    // Filtrar por landing page selecionada
    if (selectedLandingPage) {
      filtered = filtered.filter(lead => lead.landing_page_id === selectedLandingPage)
    }

    // Filtrar por termo de pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead => {
        // Pesquisar em todos os campos do lead
        return Object.values(lead.data || {}).some(value => 
          String(value).toLowerCase().includes(query)
        ) || 
        lead.landing_page?.title.toLowerCase().includes(query) ||
        lead.landing_page?.slug.toLowerCase().includes(query)
      })
    }

    setFilteredLeads(filtered)
  }

  function resetFilters() {
    setSearchQuery('')
    setSelectedLandingPage(null)
    setFilteredLeads(leads)
  }

  function exportToExcel() {
    try {
      // Preparar dados para exportação
      const exportData = filteredLeads.map(lead => {
        const leadData = {
          'ID': lead.id,
          'Data de Criação': format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          'Landing Page': lead.landing_page?.title || 'N/A',
          'Slug': lead.landing_page?.slug || 'N/A',
          ...lead.data
        }
        return leadData
      })

      // Criar planilha e arquivo para download
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
      
      // Ajustar largura das colunas
      const maxWidth = Object.keys(exportData[0] || {}).reduce((acc, key) => {
        return Math.max(acc, key.length)
      }, 10)
      
      const colWidth = maxWidth < 20 ? 20 : maxWidth
      worksheet['!cols'] = Array(Object.keys(exportData[0] || {}).length).fill({ wch: colWidth })
      
      // Gerar e baixar o arquivo
      XLSX.writeFile(workbook, `leads-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
    } catch (error) {
      console.error('Erro ao exportar leads:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    }
  }

  async function handleDeleteLead(id: string) {
    if (!confirm('Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Atualizar lista de leads após exclusão
      setLeads(leads.filter(lead => lead.id !== id))
      setFilteredLeads(filteredLeads.filter(lead => lead.id !== id))
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      alert('Erro ao excluir lead. Tente novamente.')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Gerencie os leads capturados das suas landing pages
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            disabled={filteredLeads.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar leads..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar por Landing Page
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setSelectedLandingPage(null)}>
                  Todas as Landing Pages
                </DropdownMenuItem>
                {landingPages.map((page) => (
                  <DropdownMenuItem 
                    key={page.id} 
                    onClick={() => setSelectedLandingPage(page.id)}
                  >
                    {page.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchQuery || selectedLandingPage) && (
            <Button 
              variant="ghost" 
              onClick={resetFilters}
              className="w-full md:w-auto"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Total de Leads</h3>
          <p className="text-2xl font-bold">{leads.length}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Leads Filtrados</h3>
          <p className="text-2xl font-bold">{filteredLeads.length}</p>
        </div>
        <div className="bg-card rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Landing Pages</h3>
          <p className="text-2xl font-bold">{landingPages.length}</p>
        </div>
      </div>

      {selectedLandingPage && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            Filtrando por: {landingPages.find(p => p.id === selectedLandingPage)?.title}
            <button 
              className="ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedLandingPage(null)}
            >
              ×
            </button>
          </Badge>
        </div>
      )}

      {/* Tabela de Leads */}
      <div className="bg-card rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[180px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {leads.length === 0 
                      ? "Nenhum lead encontrado. Aguarde capturas dos seus formulários."
                      : "Nenhum lead corresponde aos filtros aplicados."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {format(new Date(lead.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{lead.data.nome || lead.data.name || '-'}</TableCell>
                    <TableCell>{lead.data.email || '-'}</TableCell>
                    <TableCell>{lead.data.telefone || lead.data.phone || '-'}</TableCell>
                    <TableCell>
                      {lead.landing_page?.title || <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedLead && (
        <Dialog
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
        >
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Data de Captura
                </h3>
                <p>
                  {format(
                    new Date(selectedLead.created_at), 
                    'dd/MM/yyyy HH:mm:ss', 
                    { locale: ptBR }
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Landing Page
                </h3>
                <p>{selectedLead?.landing_page?.title || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">
                  Slug: {selectedLead?.landing_page?.slug || 'N/A'}
                </p>
              </div>
              <div className="border-t pt-3">
                <h3 className="text-sm font-medium mb-2">
                  Dados do Formulário
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedLead.data || {}).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-medium w-1/3 text-muted-foreground">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </span>
                      <span className="w-2/3">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteLead(selectedLead.id);
                  setSelectedLead(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Lead
              </Button>
              <Button variant="outline" onClick={() => setSelectedLead(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 