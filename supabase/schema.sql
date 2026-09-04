-- =====================================================================
--  랩 마우스 콜로니 현황 — Supabase 스키마 + 초기 데이터
--  SQL Editor에 붙여넣고 Run. 기존 프로젝트에 추가해도 안 겹칩니다 (mc_ 접두).
-- =====================================================================

create table if not exists public.mc_cages (
  id uuid primary key default gen_random_uuid(),
  grp text not null,                 -- chd8 | gfap | behavior
  label text not null,               -- 1, GL2, IHC-10-1 (CNT)
  type text default 'mating',        -- mating | dox | behavior | ihc | other
  note text default '',
  male text default '', female text default '', total text default '',
  g1_label text default '', g2_label text default '', g3_label text default '',
  sort int default 0,
  updated_by text default '', updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists mc_cages_grp_idx on public.mc_cages(grp, sort);

create table if not exists public.mc_mice (
  id uuid primary key default gen_random_uuid(),
  cage_id uuid references public.mc_cages(id) on delete cascade,
  label text default '',             -- M1, F5, baby
  g1 text default '', g2 text default '', g3 text default '',
  dob text default '',               -- 원본 표기 유지 (25.03.27, 26.01.16~18)
  note text default '', weight text default '', dose text default '',
  sort int default 0,
  updated_by text default '', updated_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists mc_mice_cage_idx on public.mc_mice(cage_id, sort);

create table if not exists public.mc_dox (
  id uuid primary key default gen_random_uuid(),
  grp text default 'gfap',
  cycle text default '', dose text default '', dates text default '',
  status text default '예정',        -- 완료 | 진행중 | 예정
  note text default '', sort int default 0,
  updated_by text default '', updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.mc_log (
  id uuid primary key default gen_random_uuid(),
  who text default '', action text default '', target text default '',
  created_at timestamptz default now()
);

create table if not exists public.mc_members (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- ---- 링크만 알면 열람·편집 (anon 허용) ----
alter table public.mc_cages   enable row level security;
alter table public.mc_mice    enable row level security;
alter table public.mc_dox     enable row level security;
alter table public.mc_log     enable row level security;
alter table public.mc_members enable row level security;

drop policy if exists mc_cages_all   on public.mc_cages;
drop policy if exists mc_mice_all    on public.mc_mice;
drop policy if exists mc_dox_all     on public.mc_dox;
drop policy if exists mc_log_all     on public.mc_log;
drop policy if exists mc_members_all on public.mc_members;
create policy mc_cages_all   on public.mc_cages   for all to anon, authenticated using (true) with check (true);
create policy mc_mice_all    on public.mc_mice    for all to anon, authenticated using (true) with check (true);
create policy mc_dox_all     on public.mc_dox     for all to anon, authenticated using (true) with check (true);
create policy mc_log_all     on public.mc_log     for all to anon, authenticated using (true) with check (true);
create policy mc_members_all on public.mc_members for all to anon, authenticated using (true) with check (true);

alter publication supabase_realtime add table public.mc_cages;
alter publication supabase_realtime add table public.mc_mice;
alter publication supabase_realtime add table public.mc_dox;
alter publication supabase_realtime add table public.mc_log;

-- 재실행 시 초기화 (초기 이관용)
truncate public.mc_mice, public.mc_cages, public.mc_dox restart identity cascade;


-- ---- 케이지 ----
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','1 (Ori)','mating','CNT Cage 1 (Ori)','1','1','2','Chd8','Nes-cre','tdT',0);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','2','mating','CNT Cage 2','1','2','3','Chd8','Nes-cre','tdT',1);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','3','mating','CNT Cage 3','1','2','3','Chd8','Nes-cre','tdT',2);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','4','mating','CNT Cage 3','1','2','3','Chd8','Nes-cre','tdT',3);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','5','mating','CNT Cage 4','2','3','5','Chd8','Nes-cre','tdT',4);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','10','mating','WNT Cage 1','3','0','3','Chd8','Nes-cre','tdT',5);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','11','mating','WNT Cage 2','3','2','5','Chd8','Nes-cre','tdT',6);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','12','mating','WNT Cage 3','1','2','3','Chd8','Nes-cre','tdT',7);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','13','mating','WNT Cage 4','1','3','4','Chd8','Nes-cre','tdT',8);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','14','mating','WNT Cage 5','1','2','3','Chd8','Nes-cre','tdT',9);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','RX-2','mating','','','','','R1117X','Nes-cre','tdT',10);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','RX-4','mating','','','','','R1117X','Nes-cre','tdT',11);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('chd8','RX-5','mating','','','','','R1117X','Nes-cre','tdT',12);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL1','mating','TG / HT / HT','','','','GFAP-cre','LSL-rtTA','4F2A',13);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL2','mating','TG / HT / HT','','','','GFAP-cre','LSL-rtTA','4F2A',14);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL3','mating','TG / HT / HT','','','','GFAP-cre','LSL-rtTA','4F2A',15);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL4','mating','TG / HT / HT','','','','GFAP-cre','LSL-rtTA','4F2A',16);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL5','mating','TG / HT / HT','','','','GFAP-cre','LSL-rtTA','4F2A',17);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','GL6','mating','','','','','GFAP-cre','LSL-rtTA','4F2A',18);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','Dox1','dox','','Male','Female','Total','GFAP-cre','LSL-rtTA','4F2A',19);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','G1','mating','TG','','','','GFAP-cre','LSL-rtTA','4F2A',20);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','G2','mating','TG','','','','GFAP-cre','LSL-rtTA','4F2A',21);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('gfap','G4','mating','','','','','GFAP-cre','LSL-rtTA','4F2A',22);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','B-1','behavior','','3','TAM (25/07/14~18)','시간 기준','Chd8','Nes-cre','tdT',23);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','B-2','behavior','','3','TAM (25/07/14~18)','시간 기준','Chd8','Nes-cre','tdT',24);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','B-3','behavior','','6','TAM (25/08/18~22) / Prep (12w)','TAM 기준','Chd8','Nes-cre','tdT',25);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-1','ihc','TAM (25.10.20~24) 완','','TAM (25.10.20~24) 완','','Chd8','Nes-cre','tdT',26);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-2','ihc','','','','','Chd8','Nes-cre','tdT',27);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-3','ihc','TAM (25.11.24~28) 완','','TAM (25.11.24~28) 완','','Chd8','Nes-cre','tdT',28);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-4','ihc','','','','','Chd8','Nes-cre','tdT',29);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-6','ihc','','','','','Chd8','Nes-cre','tdT',30);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-7-1','ihc','Marble / Open Filed / Social Test (오후3시) (12~16w 진행하면 될듯)','','TAM (26.02.16~20) 완','4/13 Prep','Chd8','Nes-cre','tdT',31);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-7-2','ihc','','','','','Chd8','Nes-cre','tdT',32);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-8','ihc','Marble / Open Filed / Social Test (오후3시)','','TAM (26.03.02~6) 완','','Chd8','Nes-cre','tdT',33);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-9 (WNT)','ihc','','','','','Chd8','Nes-cre','tdT',34);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-10-1','ihc','TAM (26.05.25~29) 완','','TAM (26.05.25~29) 완','OPC & Social test 완','Chd8','Nes-cre','tdT',35);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-10-2','ihc','TAM (26.05.25~29) 완','','TAM (26.05.25~29) 완','','Chd8','Nes-cre','tdT',36);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-11-1 (WNT)','ihc','TAM (26.06.15~19) 완','','TAM (26.06.15~19) 완','OPC & Social test','Chd8','Nes-cre','tdT',37);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-10-1 (CNT)','ihc','EdU','','TAM (26.05.25~29) 완','TMZ','Chd8','Nes-cre','tdT',38);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-11-2 (WNT)','ihc','TAM (26.06.15~19) Inj 완','','TAM (26.06.15~19) Inj 완','','Chd8','Nes-cre','tdT',39);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-12-1 (CNT)','ihc','TAM (26.07.20~24) 완','','TAM (26.07.20~24) 완','OPC & Social test','Chd8','Nes-cre','tdT',40);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-13-1 (CNT)','ihc','','','','9.28 ~ 10.02 (12w)','Chd8','Nes-cre','tdT',41);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-13-2 (CNT)','ihc','TAM (26.08.10~14) 완','','TAM (26.08.10~14) 완','9.28 ~ 10.02 (12w)','Chd8','Nes-cre','tdT',42);
insert into public.mc_cages (grp,label,type,note,male,female,total,g1_label,g2_label,g3_label,sort) values ('behavior','IHC-13-3 (WNT)','ihc','TAM (26.08.10~14) 완','','TAM (26.08.10~14) 완','OPC & Social test','Chd8','Nes-cre','tdT',43);

-- ---- 개체 ----
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1.3','HM','X','X','25.03.27','','','',1 from public.mc_cages where grp='chd8' and label='1 (Ori)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','HM','O','HT','26.01.16~18','','','',2 from public.mc_cages where grp='chd8' and label='1 (Ori)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.21','IHC-14','','',3 from public.mc_cages where grp='chd8' and label='1 (Ori)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','HM','O','HM','26.07.06','','','',1 from public.mc_cages where grp='chd8' and label='2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HM','O','HM','26.07.06','','','',2 from public.mc_cages where grp='chd8' and label='2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','X','HT','25.05.28','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.09.01','IHC-15','','',4 from public.mc_cages where grp='chd8' and label='2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F3','HM','O','HM','25.07.11','','','',1 from public.mc_cages where grp='chd8' and label='3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','HM','O','HT','25.08.19','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','HT','25.07.17','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HM','O','HM','25.08.19','','','',1 from public.mc_cages where grp='chd8' and label='4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','HM','O','HT','25.08.19','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M8','HM','O','HT','25.07.17','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HM','O','HM','26.05.18','','','',1 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','HM','26.05.18','','','',2 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','HM','26.05.18','','','',3 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HM','O','HT','26.06.15','','','',4 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F3','HM','O','HM','26.06.15','','','',5 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.25','IHC-14','','',6 from public.mc_cages where grp='chd8' and label='5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','WT','O','X','25.08.30','tdT HM로 교체필요','','',1 from public.mc_cages where grp='chd8' and label='10' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','WT','O','X','25.12.04','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='10' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','WT','O','X','25.12.04','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='10' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','WT','O','X','26.01.14','tdT HM로 교체필요','','',1 from public.mc_cages where grp='chd8' and label='11' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','WT','O','X','25.10.05','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='11' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','WT','X','HT','25.10.06','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='11' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','WT','X','HT','26.01.27','tdT HM로 교체필요','','',4 from public.mc_cages where grp='chd8' and label='11' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','WT','O','HT','26.01.27','tdT HM로 교체필요','','',5 from public.mc_cages where grp='chd8' and label='11' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HT','O','HT','25.03.15','tdT HM로 교체필요','','',1 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','WT','O','HT','26.05.27~29','','','',2 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','WT','O','HT','26.05.27~29','','','',3 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HT','O','HM','26.08.11','좀더 크면 mating 1','','',4 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F3','WT','O','HM','26.08.11','좀더 크면 14로','','',5 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F4','HT','X','HM','26.08.11','좀더 크면 mating 1','','',6 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HT','O','HM','26.08.11','좀더 크면 mating 1','','',7 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.21','IHC-14','','',8 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.09.03','IHC-15','','',9 from public.mc_cages where grp='chd8' and label='12' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','WT','O','HT','26.01.30','tdT HM로 교체필요','','',1 from public.mc_cages where grp='chd8' and label='13' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','WT','O','HT','26.01.30','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='13' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F10','WT','O','HT','26.01.30','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='13' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','WT','O','HT','26.05.27~29','','','',4 from public.mc_cages where grp='chd8' and label='13' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.17','IHC-14','','',5 from public.mc_cages where grp='chd8' and label='13' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','WT','O','HT','26.05.27~29','tdT HM로 교체필요','','',1 from public.mc_cages where grp='chd8' and label='14' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','WT','O','HT','26.05.27~29','tdT HM로 교체필요','','',2 from public.mc_cages where grp='chd8' and label='14' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','WT','O','HT','26.05.27~29','tdT HM로 교체필요','','',3 from public.mc_cages where grp='chd8' and label='14' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.09.02','IHC-15','','',4 from public.mc_cages where grp='chd8' and label='14' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','HM','X','X','25.08.11','','','',1 from public.mc_cages where grp='chd8' and label='RX-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F8','HM','X','X','25.08.11','','','',2 from public.mc_cages where grp='chd8' and label='RX-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5,10','HT','X','X','25.09.03~09','','','',3 from public.mc_cages where grp='chd8' and label='RX-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4,10','WT','X','X','','','','',4 from public.mc_cages where grp='chd8' and label='RX-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1,10','HM','X','X','25.09.03~09','','','',1 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1,10','WT','X','X','25.09.03~09','','','',2 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2,10','WT','X','X','25.09.03~09','','','',3 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HT','X','X','26.03.03','','','',4 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','HT','X','X','26.03.03','','','',5 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HT','X','X','26.03.03','','','',6 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F4','HT','X','X','26.03.03','','','',7 from public.mc_cages where grp='chd8' and label='RX-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HT','','','26.04.01~09','','','',1 from public.mc_cages where grp='chd8' and label='RX-5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','','','26.04.01~09','','','',2 from public.mc_cages where grp='chd8' and label='RX-5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','HT','','','26.04.01~09','','','',3 from public.mc_cages where grp='chd8' and label='RX-5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','O','X','X','','','','',1 from public.mc_cages where grp='gfap' and label='GL1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F6','O','X','X','','','','',2 from public.mc_cages where grp='gfap' and label='GL1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','O','HT','HT','','미친 번식왕','','',3 from public.mc_cages where grp='gfap' and label='GL1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.12','','','GNTP',4 from public.mc_cages where grp='gfap' and label='GL1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','O','X','X','','','','',1 from public.mc_cages where grp='gfap' and label='GL2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F7','O','X','X','','','','',2 from public.mc_cages where grp='gfap' and label='GL2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.09.03','','','',3 from public.mc_cages where grp='gfap' and label='GL2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','X','HT','HT','26.05.24~29','','','',1 from public.mc_cages where grp='gfap' and label='GL3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','O','HT','X','26.06.19','','','',2 from public.mc_cages where grp='gfap' and label='GL3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','O','HT','X','26.06.19','','','',3 from public.mc_cages where grp='gfap' and label='GL3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.14','','','GNTP',4 from public.mc_cages where grp='gfap' and label='GL3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','X','HT','HT','26.05.24~29','','','',1 from public.mc_cages where grp='gfap' and label='GL4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','X','HT','HT','26.06.15','','','',2 from public.mc_cages where grp='gfap' and label='GL4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','O','HT','HT','26.06.15','DOX (26.08.19~)','','Dox 0.15mg',3 from public.mc_cages where grp='gfap' and label='GL4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.25','','','',4 from public.mc_cages where grp='gfap' and label='GL4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','O','HT','X','26.06.26','','','',1 from public.mc_cages where grp='gfap' and label='GL5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','O','HT','HT','26.06.19','DOX (26.08.19~)','','Dox 0.15mg',2 from public.mc_cages where grp='gfap' and label='GL5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.25','','','',3 from public.mc_cages where grp='gfap' and label='GL5' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','O','HT','X','2026.7.23~24','','','',1 from public.mc_cages where grp='gfap' and label='GL6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F5','O','HT','X','2026.7.23~24','','','',2 from public.mc_cages where grp='gfap' and label='GL6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','O','X','HT','2026.7.23~24','','','',3 from public.mc_cages where grp='gfap' and label='GL6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','O','X','HT','2026.7.23~24','','','',4 from public.mc_cages where grp='gfap' and label='GL6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F3','O','HT','HT','2026.7.23~24','DOX (예정)','','',1 from public.mc_cages where grp='gfap' and label='Dox1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F7','O','HT','HT','2026.7.23~24','DOX (예정)','','',2 from public.mc_cages where grp='gfap' and label='Dox1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','O','HT','HT','2026.7.23~24','DOX (예정)','','',3 from public.mc_cages where grp='gfap' and label='Dox1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','O','HT','HT','2026.7.23~24','DOX (예정)','','',4 from public.mc_cages where grp='gfap' and label='Dox1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','O','HT','HT','2026.7.23~24','DOX (예정)','','',5 from public.mc_cages where grp='gfap' and label='Dox1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F','O','X','X','','','','',1 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','O','X','X','','','','',2 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','O','X','X','','','','',3 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','O','X','X','','','','',4 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','O','X','X','','','','',5 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','O','X','X','','','','',6 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.13','','','',7 from public.mc_cages where grp='gfap' and label='G1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','O','X','X','','','','',1 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F3','O','X','X','','','','',2 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F4','O','X','X','','','','',3 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F9','O','X','X','','','','',4 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','O','X','X','26.06.04','','','',5 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','O','X','X','26.06.04','','','',6 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','O','X','X','26.06.04','','','',7 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.09.03','','','',8 from public.mc_cages where grp='gfap' and label='G2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','O','X','X','','','','',1 from public.mc_cages where grp='gfap' and label='G4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F2','O','X','X','','','','',2 from public.mc_cages where grp='gfap' and label='G4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','O','X','X','','','','',3 from public.mc_cages where grp='gfap' and label='G4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'baby','','','','26.08.29','','','',4 from public.mc_cages where grp='gfap' and label='G4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.06.17','IHC 진행 (13w)','','25.07.27',1 from public.mc_cages where grp='behavior' and label='B-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','25.06.17','IHC 진행 (13w)','','',2 from public.mc_cages where grp='behavior' and label='B-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','25.06.15','IHC 진행 (13w)','','',3 from public.mc_cages where grp='behavior' and label='B-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.06.18','IHC 진행 (13w)','','25.07.27',1 from public.mc_cages where grp='behavior' and label='B-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.06.19','IHC 진행 (13w)','','',2 from public.mc_cages where grp='behavior' and label='B-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','X','25.06.19','','','',3 from public.mc_cages where grp='behavior' and label='B-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','X','25.07.21','','','1w',1 from public.mc_cages where grp='behavior' and label='B-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.07.21','Prep (25/10/13)','','25.08.31',2 from public.mc_cages where grp='behavior' and label='B-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','X','25.07.21','','','',3 from public.mc_cages where grp='behavior' and label='B-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','X','25.07.21','','','15d',4 from public.mc_cages where grp='behavior' and label='B-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6,7','HM','O','O','25.07.21','Prep (25/10/13)','','1w',5 from public.mc_cages where grp='behavior' and label='B-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','O','25.09.24','Prep (25/12/15) 완','9.75g','',1 from public.mc_cages where grp='behavior' and label='IHC-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.09.25','Prep (25/12/15) 완','9.63g','',2 from public.mc_cages where grp='behavior' and label='IHC-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','O','25.09.24','Prep (25/12/15) 완','9.10g','',3 from public.mc_cages where grp='behavior' and label='IHC-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','25.09.24','Prep (25/12/15) 완','9.30g','',4 from public.mc_cages where grp='behavior' and label='IHC-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.09.21~24','Prep (25/12/15) 완','14.50g','',1 from public.mc_cages where grp='behavior' and label='IHC-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','25.09.21~24','Prep (25/12/15) 완','17.48g','',2 from public.mc_cages where grp='behavior' and label='IHC-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','25.09.21~24','Prep (25/12/15) 완','17.90g','',3 from public.mc_cages where grp='behavior' and label='IHC-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'F1','WT','O','O','25.10.16','Prep (26/01/06) 완','16.5g','',1 from public.mc_cages where grp='behavior' and label='IHC-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','WT','O','O','25.10.16','Prep (26/01/06) 완','16.5g','',2 from public.mc_cages where grp='behavior' and label='IHC-3' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','O','25.10.13~14','Prep (26/01/06) 완','14.9g','',1 from public.mc_cages where grp='behavior' and label='IHC-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','25.10.13~14','Prep (26/01/06) 완','15.8g','',2 from public.mc_cages where grp='behavior' and label='IHC-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','25.10.13~14','Prep (26/01/06) 완','20g','',3 from public.mc_cages where grp='behavior' and label='IHC-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M7','HM','O','O','25.10.21','Prep (26/01/13) 예정','12.5g','',4 from public.mc_cages where grp='behavior' and label='IHC-4' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','15.9g','',1 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','13.6g','',2 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','9.7g','',3 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','14.2g','',4 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','12.6g','',5 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1,10','HM','O','O','25.10.21 / 25','Prep (26/01/13) 예정','14.45g','',6 from public.mc_cages where grp='behavior' and label='IHC-6' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','O','26.01.16~18','Prep (26/05/01) 완','9.05g','',1 from public.mc_cages where grp='behavior' and label='IHC-7-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','O','26.01.16~18','Prep (26/05/01) 완','7.4g','',2 from public.mc_cages where grp='behavior' and label='IHC-7-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','26.01.16~18','Prep (26/05/01) 완','9.08g','시작',3 from public.mc_cages where grp='behavior' and label='IHC-7-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M7','HM','O','O','26.01.16~18','Prep 완','7.8g','2월 16일',1 from public.mc_cages where grp='behavior' and label='IHC-7-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M8','HM','O','X','26.01.16~18','Prep 완','8.75g','4w',2 from public.mc_cages where grp='behavior' and label='IHC-7-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M9','HM','O','O','26.01.16~18','Prep 완','10.85g','',3 from public.mc_cages where grp='behavior' and label='IHC-7-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','O','26.01.27~30','Prep 완','','',1 from public.mc_cages where grp='behavior' and label='IHC-8' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','26.01.27~30','Prep 완','','',2 from public.mc_cages where grp='behavior' and label='IHC-8' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M7','WT','O','O','26.01.27~30','Prep (26/05/01) 완','','0d',1 from public.mc_cages where grp='behavior' and label='IHC-9 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M8','WT','O','O','26.01.27~30','Prep (26/05/01) 완','','3월 2일',2 from public.mc_cages where grp='behavior' and label='IHC-9 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M9','WT','O','O','26.01.27~30','Prep (26/05/01) 완','','4w',3 from public.mc_cages where grp='behavior' and label='IHC-9 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','22.3g','',1 from public.mc_cages where grp='behavior' and label='IHC-10-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','16.8g','',2 from public.mc_cages where grp='behavior' and label='IHC-10-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','21.2g','',3 from public.mc_cages where grp='behavior' and label='IHC-10-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','15.3g','',4 from public.mc_cages where grp='behavior' and label='IHC-10-1' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M6','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','16.5g','',1 from public.mc_cages where grp='behavior' and label='IHC-10-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M8','HM','O','O','26.04.21~27','behavior test > Prep (26.07.20~)','14.2g','',2 from public.mc_cages where grp='behavior' and label='IHC-10-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M9','HM','O','X','26.04.21~27','behavior test > Prep (26.07.20~)','9.92g','',3 from public.mc_cages where grp='behavior' and label='IHC-10-2' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','WT','O','O','26.05.14','behavior test > Prep (26.08.10~)','20.8g','',1 from public.mc_cages where grp='behavior' and label='IHC-11-1 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','WT','O','O','26.05.14','behavior test > Prep (26.08.10~)','18.1g','',2 from public.mc_cages where grp='behavior' and label='IHC-11-1 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','WT','O','X','26.05.14','behavior test > Prep (26.08.10~)','20.7g','',3 from public.mc_cages where grp='behavior' and label='IHC-11-1 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','O','26.04.21~27','','15.3g','',1 from public.mc_cages where grp='behavior' and label='IHC-10-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M8','HM','O','O','26.04.21~27','','14.2g','',2 from public.mc_cages where grp='behavior' and label='IHC-10-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','WT','O','X','26.05.16~17','','21.5g','',1 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','WT','O','X','26.05.16~17','','20.1g','',2 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','WT','O','O','26.05.16~17','','19.5g','',3 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'1','WT','X','X','26.04.27~28','','','',4 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'2','WT','X','X','26.04.27~28','','','',5 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'3','WT','X','X','26.04.27~28','','','',6 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'4','WT','X','X','26.04.27~28','','','',7 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'5','WT','X','X','26.04.27~28','','','',8 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'6','WT','X','X','26.04.27~28','','','',9 from public.mc_cages where grp='behavior' and label='IHC-11-2 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','HT','26.06.15','','18.6g','',1 from public.mc_cages where grp='behavior' and label='IHC-12-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','HT','26.06.15','','17.3g','',2 from public.mc_cages where grp='behavior' and label='IHC-12-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','HT','26.06.15','','18.5g','',3 from public.mc_cages where grp='behavior' and label='IHC-12-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','HM','O','HT','26.06.15','','17.4g','',4 from public.mc_cages where grp='behavior' and label='IHC-12-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','HM','26.07.06','','20g','',1 from public.mc_cages where grp='behavior' and label='IHC-13-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','HT','26.07.06','','24g','',2 from public.mc_cages where grp='behavior' and label='IHC-13-1 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','HM','O','HT','26.07.06','','22.3g','',1 from public.mc_cages where grp='behavior' and label='IHC-13-2 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','HM','O','HT','26.07.06','','22.8g','',2 from public.mc_cages where grp='behavior' and label='IHC-13-2 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M3','HM','O','HT','26.07.06','','15g','',3 from public.mc_cages where grp='behavior' and label='IHC-13-2 (CNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M1','WT','O','HT','2026.7.13~15','','13.7g','',1 from public.mc_cages where grp='behavior' and label='IHC-13-3 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M2','WT','O','HT','2026.7.13~15','','16.5g','',2 from public.mc_cages where grp='behavior' and label='IHC-13-3 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M4','WT','O','HT','2026.7.13~15','','14.1g','',3 from public.mc_cages where grp='behavior' and label='IHC-13-3 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M5','WT','O','HT','2026.7.13~15','','16.1g','',4 from public.mc_cages where grp='behavior' and label='IHC-13-3 (WNT)' limit 1;
insert into public.mc_mice (cage_id,label,g1,g2,g3,dob,note,weight,dose,sort) select id,'M7','WT','O','HT','2026.7.13~15','','18.7g','',5 from public.mc_cages where grp='behavior' and label='IHC-13-3 (WNT)' limit 1;

-- ---- DOX 스케줄 ----
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.08.19~21','완료','Dox 0.15mg 26.08.19~21',0);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.08.24~26','완료','Dox 0.15mg 26.08.24~26',1);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.08.29~31','완료','Dox 0.15mg 26.08.29~31',2);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.03~05','진행중','Dox 0.15mg 26.09.03~05',3);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.08~10','예정','Dox 0.15mg 26.09.08~10',4);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.13~15','예정','Dox 0.15mg 26.09.13~15',5);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.18~20','예정','Dox 0.15mg 26.09.18~20',6);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.23~25','예정','Dox 0.15mg 26.09.23~25',7);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.09.28~30','예정','Dox 0.15mg 26.09.28~30',8);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.03~05','예정','Dox 0.15mg 26.10.03~05',9);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.08~10','예정','Dox 0.15mg 26.10.08~10',10);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.13~15','예정','Dox 0.15mg 26.10.13~15',11);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.18~20','예정','Dox 0.15mg 26.10.18~20',12);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.23~25','예정','Dox 0.15mg 26.10.23~25',13);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.10.28~30','예정','Dox 0.15mg 26.10.28~30',14);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.02~04','예정','Dox 0.15mg 26.11.02~04',15);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.07~09','예정','Dox 0.15mg 26.11.07~09',16);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.12~14','예정','Dox 0.15mg 26.11.12~14',17);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.17~19','예정','Dox 0.15mg 26.11.17~19',18);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.22~24','예정','Dox 0.15mg 26.11.22~24',19);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.11.27~29','예정','Dox 0.15mg 26.11.27~29',20);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.02~04','예정','Dox 0.15mg 26.12.02~04',21);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.07~09','예정','Dox 0.15mg 26.12.07~09',22);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.12~14','예정','Dox 0.15mg 26.12.12~14',23);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.17~19','예정','Dox 0.15mg 26.12.17~19',24);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.22~24','예정','Dox 0.15mg 26.12.22~24',25);
insert into public.mc_dox (grp,cycle,dose,dates,status,note,sort) values ('gfap','1 Cycle','0.15mg','26.12.27~29','예정','Dox 0.15mg 26.12.27~29',26);
