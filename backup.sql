--
-- PostgreSQL database dump
--

\restrict 4gN51Ur1JpQEECodk2XKqijyOS7GacFCV6azi3d1ByhGZn4eXNcGZkKaasprDHv

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-23 12:44:47

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 31547)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 32771)
-- Name: bts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bts (
    id_bts integer NOT NULL,
    nama_bts character varying(100),
    latitude double precision,
    longitude double precision,
    id_operator integer,
    id_jaringan integer,
    id_wilayah integer,
    alamat text,
    tahun integer,
    geom public.geometry(Point,4326)
);


ALTER TABLE public.bts OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 32770)
-- Name: bts_id_bts_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bts_id_bts_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bts_id_bts_seq OWNER TO postgres;

--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 233
-- Name: bts_id_bts_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bts_id_bts_seq OWNED BY public.bts.id_bts;


--
-- TOC entry 228 (class 1259 OID 32742)
-- Name: jaringan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jaringan (
    id_jaringan integer NOT NULL,
    jaringan character varying(20) CONSTRAINT jaringan_jenis_jaringan_not_null NOT NULL
);


ALTER TABLE public.jaringan OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 32741)
-- Name: jaringan_id_jaringan_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jaringan_id_jaringan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jaringan_id_jaringan_seq OWNER TO postgres;

--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 227
-- Name: jaringan_id_jaringan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jaringan_id_jaringan_seq OWNED BY public.jaringan.id_jaringan;


--
-- TOC entry 236 (class 1259 OID 32796)
-- Name: log_aktivitas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_aktivitas (
    id_log integer NOT NULL,
    id_user integer,
    id_bts integer,
    aktivitas text,
    waktu timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.log_aktivitas OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 32795)
-- Name: log_aktivitas_id_log_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.log_aktivitas_id_log_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.log_aktivitas_id_log_seq OWNER TO postgres;

--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 235
-- Name: log_aktivitas_id_log_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.log_aktivitas_id_log_seq OWNED BY public.log_aktivitas.id_log;


--
-- TOC entry 226 (class 1259 OID 32733)
-- Name: operator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.operator (
    id_operator integer NOT NULL,
    operator character varying(100) CONSTRAINT operator_nama_operator_not_null NOT NULL
);


ALTER TABLE public.operator OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 32732)
-- Name: operator_id_operator_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.operator_id_operator_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operator_id_operator_seq OWNER TO postgres;

--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 225
-- Name: operator_id_operator_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.operator_id_operator_seq OWNED BY public.operator.id_operator;


--
-- TOC entry 238 (class 1259 OID 32817)
-- Name: statistik; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.statistik (
    id_stat integer NOT NULL,
    id_wilayah integer,
    jumlah_bts integer,
    dominan_jaringan character varying(20)
);


ALTER TABLE public.statistik OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 32816)
-- Name: statistik_id_stat_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.statistik_id_stat_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statistik_id_stat_seq OWNER TO postgres;

--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 237
-- Name: statistik_id_stat_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.statistik_id_stat_seq OWNED BY public.statistik.id_stat;


--
-- TOC entry 232 (class 1259 OID 32761)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id_user integer NOT NULL,
    nama character varying(100),
    email character varying(100),
    password character varying(255),
    role character varying(20),
    status character varying(20)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 32760)
-- Name: users_id_user_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_user_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_user_seq OWNER TO postgres;

--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 231
-- Name: users_id_user_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_user_seq OWNED BY public.users.id_user;


--
-- TOC entry 230 (class 1259 OID 32751)
-- Name: wilayah; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wilayah (
    id_wilayah integer NOT NULL,
    kab_kota character varying(100),
    geom public.geometry(MultiPolygon,4326)
);


ALTER TABLE public.wilayah OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 32750)
-- Name: wilayah_id_wilayah_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wilayah_id_wilayah_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wilayah_id_wilayah_seq OWNER TO postgres;

--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 229
-- Name: wilayah_id_wilayah_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wilayah_id_wilayah_seq OWNED BY public.wilayah.id_wilayah;


--
-- TOC entry 5803 (class 2604 OID 32774)
-- Name: bts id_bts; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bts ALTER COLUMN id_bts SET DEFAULT nextval('public.bts_id_bts_seq'::regclass);


--
-- TOC entry 5800 (class 2604 OID 32745)
-- Name: jaringan id_jaringan; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jaringan ALTER COLUMN id_jaringan SET DEFAULT nextval('public.jaringan_id_jaringan_seq'::regclass);


--
-- TOC entry 5804 (class 2604 OID 32799)
-- Name: log_aktivitas id_log; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas ALTER COLUMN id_log SET DEFAULT nextval('public.log_aktivitas_id_log_seq'::regclass);


--
-- TOC entry 5799 (class 2604 OID 32736)
-- Name: operator id_operator; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator ALTER COLUMN id_operator SET DEFAULT nextval('public.operator_id_operator_seq'::regclass);


--
-- TOC entry 5806 (class 2604 OID 32820)
-- Name: statistik id_stat; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statistik ALTER COLUMN id_stat SET DEFAULT nextval('public.statistik_id_stat_seq'::regclass);


--
-- TOC entry 5802 (class 2604 OID 32764)
-- Name: users id_user; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id_user SET DEFAULT nextval('public.users_id_user_seq'::regclass);


--
-- TOC entry 5801 (class 2604 OID 32754)
-- Name: wilayah id_wilayah; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wilayah ALTER COLUMN id_wilayah SET DEFAULT nextval('public.wilayah_id_wilayah_seq'::regclass);


--
-- TOC entry 5995 (class 0 OID 32771)
-- Dependencies: 234
-- Data for Name: bts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bts (id_bts, nama_bts, latitude, longitude, id_operator, id_jaringan, id_wilayah, alamat, tahun, geom) FROM stdin;
1	BTS-DUM-001	1.676813	101.433534	3	2	12	Rimba Sekampung, Kota Dumai, Riau	2017	0101000020E61000000FED6305BF5B5940541F48DE39D4FA3F
2	BTS-DUM-002	1.677475	101.431961	2	1	12	Laksmana, Kota Dumai, Riau	2016	0101000020E61000007009C03FA55B5940BBB88D06F0D6FA3F
3	BTS-DUM-003	1.676339	101.431378	2	3	12	Rimba Sekampung, Kota Dumai, Riau	2017	0101000020E6100000B08D78B29B5B59404626E0D748D2FA3F
4	BTS-DUM-004	1.682961	101.447351	1	1	12	Binjai, Kota Dumai, Riau	2016	0101000020E61000004EB51666A15C59406518778368EDFA3F
5	BTS-DUM-005	1.675426	101.436896	1	2	12	Rimba Sekampung, Kota Dumai, Riau	2017	0101000020E610000035F0A31AF65B5940B9E34D7E8BCEFA3F
6	BTS-DUM-006	1.681164	101.44594	1	1	12	Binjai, Kota Dumai, Riau	2016	0101000020E61000009BFEEC478A5C59409566F3380CE6FA3F
8	BTS-DUM-008	1.680846	101.445966	3	2	12	Binjai, Kota Dumai, Riau	2017	0101000020E61000003048FAB48A5C594075CC79C6BEE4FA3F
7	BTS-DUM-007	1.660995	101.446984	1	1	12	Bintan, Kota Dumai, Riau	2016	0101000020E61000007575C7629B5C594071218FE0460AFB3F
\.


--
-- TOC entry 5989 (class 0 OID 32742)
-- Dependencies: 228
-- Data for Name: jaringan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jaringan (id_jaringan, jaringan) FROM stdin;
1	2G
2	3G
3	4G
4	5G
\.


--
-- TOC entry 5997 (class 0 OID 32796)
-- Dependencies: 236
-- Data for Name: log_aktivitas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.log_aktivitas (id_log, id_user, id_bts, aktivitas, waktu) FROM stdin;
\.


--
-- TOC entry 5987 (class 0 OID 32733)
-- Dependencies: 226
-- Data for Name: operator; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.operator (id_operator, operator) FROM stdin;
1	Telkomsel
2	Indosat
3	XL Axiata
4	Tri
\.


--
-- TOC entry 5798 (class 0 OID 31866)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 5999 (class 0 OID 32817)
-- Dependencies: 238
-- Data for Name: statistik; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.statistik (id_stat, id_wilayah, jumlah_bts, dominan_jaringan) FROM stdin;
\.


--
-- TOC entry 5993 (class 0 OID 32761)
-- Dependencies: 232
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id_user, nama, email, password, role, status) FROM stdin;
1	Admin WebGIS	admin@webgis.com	admin123	admin	aktif
\.


--
-- TOC entry 5991 (class 0 OID 32751)
-- Dependencies: 230
-- Data for Name: wilayah; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wilayah (id_wilayah, kab_kota, geom) FROM stdin;
1	Kuantan Singingi	\N
2	Indragiri Hulu	\N
3	Indragiri Hilir	\N
4	Pelalawan	\N
5	Siak	\N
6	Kampar	\N
7	Rokan Hulu	\N
8	Bengkalis	\N
9	Rokan Hilir	\N
10	Meranti	\N
11	Kota Pekanbaru	\N
12	Kota Dumai	\N
\.


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 233
-- Name: bts_id_bts_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bts_id_bts_seq', 8, true);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 227
-- Name: jaringan_id_jaringan_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jaringan_id_jaringan_seq', 4, true);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 235
-- Name: log_aktivitas_id_log_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.log_aktivitas_id_log_seq', 1, false);


--
-- TOC entry 6016 (class 0 OID 0)
-- Dependencies: 225
-- Name: operator_id_operator_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.operator_id_operator_seq', 4, true);


--
-- TOC entry 6017 (class 0 OID 0)
-- Dependencies: 237
-- Name: statistik_id_stat_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statistik_id_stat_seq', 1, false);


--
-- TOC entry 6018 (class 0 OID 0)
-- Dependencies: 231
-- Name: users_id_user_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_user_seq', 1, true);


--
-- TOC entry 6019 (class 0 OID 0)
-- Dependencies: 229
-- Name: wilayah_id_wilayah_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wilayah_id_wilayah_seq', 1, false);


--
-- TOC entry 5822 (class 2606 OID 32779)
-- Name: bts bts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bts
    ADD CONSTRAINT bts_pkey PRIMARY KEY (id_bts);


--
-- TOC entry 5813 (class 2606 OID 32749)
-- Name: jaringan jaringan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jaringan
    ADD CONSTRAINT jaringan_pkey PRIMARY KEY (id_jaringan);


--
-- TOC entry 5825 (class 2606 OID 32805)
-- Name: log_aktivitas log_aktivitas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas
    ADD CONSTRAINT log_aktivitas_pkey PRIMARY KEY (id_log);


--
-- TOC entry 5811 (class 2606 OID 32740)
-- Name: operator operator_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.operator
    ADD CONSTRAINT operator_pkey PRIMARY KEY (id_operator);


--
-- TOC entry 5827 (class 2606 OID 32823)
-- Name: statistik statistik_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statistik
    ADD CONSTRAINT statistik_pkey PRIMARY KEY (id_stat);


--
-- TOC entry 5818 (class 2606 OID 32769)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5820 (class 2606 OID 32767)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id_user);


--
-- TOC entry 5816 (class 2606 OID 32759)
-- Name: wilayah wilayah_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wilayah
    ADD CONSTRAINT wilayah_pkey PRIMARY KEY (id_wilayah);


--
-- TOC entry 5823 (class 1259 OID 32829)
-- Name: idx_bts_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bts_geom ON public.bts USING gist (geom);


--
-- TOC entry 5814 (class 1259 OID 32830)
-- Name: idx_wilayah_geom; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wilayah_geom ON public.wilayah USING gist (geom);


--
-- TOC entry 5831 (class 2606 OID 32811)
-- Name: log_aktivitas fk_bts; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas
    ADD CONSTRAINT fk_bts FOREIGN KEY (id_bts) REFERENCES public.bts(id_bts);


--
-- TOC entry 5828 (class 2606 OID 32785)
-- Name: bts fk_jaringan; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bts
    ADD CONSTRAINT fk_jaringan FOREIGN KEY (id_jaringan) REFERENCES public.jaringan(id_jaringan);


--
-- TOC entry 5829 (class 2606 OID 32780)
-- Name: bts fk_operator; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bts
    ADD CONSTRAINT fk_operator FOREIGN KEY (id_operator) REFERENCES public.operator(id_operator);


--
-- TOC entry 5833 (class 2606 OID 32824)
-- Name: statistik fk_stat_wilayah; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statistik
    ADD CONSTRAINT fk_stat_wilayah FOREIGN KEY (id_wilayah) REFERENCES public.wilayah(id_wilayah);


--
-- TOC entry 5832 (class 2606 OID 32806)
-- Name: log_aktivitas fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_aktivitas
    ADD CONSTRAINT fk_user FOREIGN KEY (id_user) REFERENCES public.users(id_user);


--
-- TOC entry 5830 (class 2606 OID 32790)
-- Name: bts fk_wilayah; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bts
    ADD CONSTRAINT fk_wilayah FOREIGN KEY (id_wilayah) REFERENCES public.wilayah(id_wilayah);


-- Completed on 2026-05-23 12:44:51

--
-- PostgreSQL database dump complete
--

\unrestrict 4gN51Ur1JpQEECodk2XKqijyOS7GacFCV6azi3d1ByhGZn4eXNcGZkKaasprDHv

