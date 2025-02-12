-- Adiciona coluna de visualizações
alter table public.landing_pages
add column if not exists views bigint default 0;

-- Cria função para incrementar visualizações
create or replace function public.increment_page_views(page_id uuid)
returns void as $$
begin
  update public.landing_pages
  set views = views + 1
  where id = page_id;
end;
$$ language plpgsql; 