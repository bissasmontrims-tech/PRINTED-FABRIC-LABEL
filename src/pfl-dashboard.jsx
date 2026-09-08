import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import * as XLSX from "xlsx";
import {
  LayoutGrid, Calendar, Users, Cog, Sun, ShoppingBag, Building2, Search,
  Table2, Upload, Settings as SettingsIcon, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp, X, RotateCcw, Download,
  ArrowUpDown, User, LogOut, ShieldCheck, UserCog, ClipboardList, Printer, Plus, Trash2, Save, FileText
} from "lucide-react";
import { supabase, supabaseReady } from "./lib/supabaseClient";
import {
  parseReportDate, formatDisplayDate, monthKeyOf, yearKeyOf,
  addDaysISO, startOfWeekISO, startOfMonthISO, startOfYearISO, lastDayOfPrevMonthISO,
} from "./lib/dateUtils";
import { can } from "./lib/permissions";
import UserManagement from "./components/UserManagement";

/* ============================== EMBEDDED SOURCE DATA ============================== */
/* Extracted from the uploaded PFL_PRODUCTION_REPORT.xlsx ("Raw data" sheet).
   227 valid production records for 2026-09-01. Replace/extend via Import Data. */
const RAW_DATA = [{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135754,"unitPrice":0.0074,"pcs":73550,"usd":544.27,"priceDz":0.0888,"wastage":147,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MONIR HOSEN","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135755,"unitPrice":0.0074,"pcs":26483,"usd":195.9742,"priceDz":0.0888,"wastage":53,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MONIR HOSEN","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135771,"unitPrice":0.008333333333333333,"pcs":103110,"usd":859.25,"priceDz":0.1,"wastage":206,"buyer":"LINDEX","customer":"FOUR H APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ABDUL MOMIN","machine":8},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135759,"unitPrice":0.012499999999999999,"pcs":9210,"usd":115.125,"priceDz":0.15,"wastage":18,"buyer":"LINDEX","customer":"CHERRY INTIMATE LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ABDUL MOMIN","machine":8},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135440,"unitPrice":0.0033333333333333335,"pcs":20000,"usd":66.6667,"priceDz":0.04,"wastage":40,"buyer":"KONTOOR","customer":"M/S BABYLON GARMENTS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD LITON HOSSAIN","machine":3},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135745,"unitPrice":0.0033333333333333335,"pcs":223,"usd":0.7433,"priceDz":0.04,"wastage":2,"buyer":"KONTOOR","customer":"JEANS PLUS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD LITON HOSSAIN","machine":3},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135441,"unitPrice":0.0033333333333333335,"pcs":40000,"usd":133.3333,"priceDz":0.04,"wastage":80,"buyer":"KONTOOR","customer":"M/S BABYLON GARMENTS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD LITON HOSSAIN","machine":3},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":132891,"unitPrice":0.013333333333333334,"pcs":4896,"usd":65.28,"priceDz":0.16,"wastage":10,"buyer":"LERROS","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MONSUR ALI","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":132890,"unitPrice":0.013333333333333334,"pcs":2088,"usd":27.84,"priceDz":0.16,"wastage":4,"buyer":"LERROS","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MONSUR ALI","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135253,"unitPrice":0.00375,"pcs":24010,"usd":90.0375,"priceDz":0.045,"wastage":48,"buyer":"TOKMANNI","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MONSUR ALI","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135354,"unitPrice":0.005833333333333334,"pcs":24010,"usd":140.0583,"priceDz":0.07,"wastage":48,"buyer":"MATALAN","customer":"ESSENTIAL CLOTHING LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MONSUR ALI","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":132072,"unitPrice":0.010833333333333334,"pcs":13023,"usd":141.0825,"priceDz":0.13,"wastage":26,"buyer":"VOLVO","customer":"ANLIMA TEXTILE LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MONSUR ALI","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135711,"unitPrice":0.0074,"pcs":15198,"usd":112.4652,"priceDz":0.0888,"wastage":30,"buyer":"PEPCO","customer":"IRIS DESIGN LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ROBIUL ISLAM","machine":7},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135754,"unitPrice":0.0074,"pcs":73550,"usd":544.27,"priceDz":0.0888,"wastage":147,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ROBIUL ISLAM","machine":7},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135755,"unitPrice":0.0074,"pcs":20000,"usd":148,"priceDz":0.0888,"wastage":40,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ROBIUL ISLAM","machine":7},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135754,"unitPrice":0.0074,"pcs":73550,"usd":544.27,"priceDz":0.0888,"wastage":147,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD IBRAHIM KHALIL","machine":2},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135755,"unitPrice":0.0074,"pcs":25000,"usd":185,"priceDz":0.0888,"wastage":50,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD IBRAHIM KHALIL","machine":2},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135136,"unitPrice":0.004166666666666667,"pcs":314,"usd":1.3083,"priceDz":0.05,"wastage":2,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134724,"unitPrice":0.004166666666666667,"pcs":2377,"usd":9.9042,"priceDz":0.05,"wastage":5,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134720,"unitPrice":0.004166666666666667,"pcs":632,"usd":2.6333,"priceDz":0.05,"wastage":2,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134722,"unitPrice":0.004166666666666667,"pcs":11605,"usd":48.3542,"priceDz":0.05,"wastage":23,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135090,"unitPrice":0.004166666666666667,"pcs":9946,"usd":41.4417,"priceDz":0.05,"wastage":20,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135086,"unitPrice":0.004166666666666667,"pcs":5578,"usd":23.2417,"priceDz":0.05,"wastage":11,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134790,"unitPrice":0.004166666666666667,"pcs":11355,"usd":47.3125,"priceDz":0.05,"wastage":23,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134833,"unitPrice":0.004166666666666667,"pcs":13860,"usd":57.75,"priceDz":0.05,"wastage":28,"buyer":"CARREFOUR","customer":"NAFA APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134223,"unitPrice":0.004166666666666667,"pcs":20462,"usd":85.2583,"priceDz":0.05,"wastage":41,"buyer":"CARREFOUR","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134222,"unitPrice":0.004166666666666667,"pcs":2411,"usd":10.0458,"priceDz":0.05,"wastage":5,"buyer":"CARREFOUR","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134043,"unitPrice":0.004166666666666667,"pcs":20075,"usd":83.6458,"priceDz":0.05,"wastage":40,"buyer":"CARREFOUR","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHADAT","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135661,"unitPrice":0.008333333333333333,"pcs":17000,"usd":141.6667,"priceDz":0.1,"wastage":34,"buyer":"AYBL","customer":"COTTON CLUB (BD) LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAMIM","machine":21},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":133800,"unitPrice":0.005833333333333334,"pcs":13700,"usd":79.9167,"priceDz":0.07,"wastage":27,"buyer":"OTCF","customer":"RADIAL INTERNATIONAL UNIT 2 LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAMIM","machine":21},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135214,"unitPrice":0.0074,"pcs":52000,"usd":384.8,"priceDz":0.0888,"wastage":104,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAMIM","machine":21},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":70000,"usd":518,"priceDz":0.0888,"wastage":140,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"IQBAL","machine":14},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134065,"unitPrice":0.0074,"pcs":24000,"usd":177.6,"priceDz":0.0888,"wastage":48,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"IQBAL","machine":14},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134002,"unitPrice":0.021666666666666667,"pcs":6000,"usd":130,"priceDz":0.26,"wastage":12,"buyer":"SIGNET ENTERPRISE","customer":"ADURY APPARELS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR 2","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135643,"unitPrice":0.015833333333333335,"pcs":200,"usd":3.1667,"priceDz":0.19,"wastage":2,"buyer":"DH","customer":"KNIT PLUS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR 2","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135874,"unitPrice":0.01,"pcs":21746,"usd":217.46,"priceDz":0.12,"wastage":43,"buyer":"MS MODE","customer":"MEGHNA DENIMS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR 2","machine":9},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135528,"unitPrice":0.0075,"pcs":65742,"usd":493.065,"priceDz":0.09,"wastage":131,"buyer":"HENBURY","customer":"KNIT PLUS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ALI","machine":13},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135688,"unitPrice":0.00125,"pcs":6082,"usd":7.6025,"priceDz":0.015,"wastage":12,"buyer":"TCHIBO","customer":"PANDORA SWEATERS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ALI","machine":13},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":85600,"usd":633.44,"priceDz":0.0888,"wastage":171,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SOHID","machine":8},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135753,"unitPrice":0.0074,"pcs":20000,"usd":148,"priceDz":0.0888,"wastage":40,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SOHID","machine":8},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":98018,"usd":725.3332,"priceDz":0.0888,"wastage":196,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD NAZIUL ISLAM","machine":6},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135753,"unitPrice":0.0074,"pcs":30000,"usd":222,"priceDz":0.0888,"wastage":60,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD NAZIUL ISLAM","machine":6},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":85000,"usd":629,"priceDz":0.0888,"wastage":170,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD AMIRCHAD","machine":7},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134065,"unitPrice":0.0074,"pcs":20000,"usd":148,"priceDz":0.0888,"wastage":40,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD AMIRCHAD","machine":7},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":55000,"usd":407,"priceDz":0.0888,"wastage":110,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"BIDYUTH","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135765,"unitPrice":0.008333333333333333,"pcs":32140,"usd":267.8333,"priceDz":0.1,"wastage":64,"buyer":"ERNSTING'S FAMILY","customer":"H.I. APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"BIDYUTH","machine":4},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135446,"unitPrice":0.005833333333333334,"pcs":25625,"usd":149.4792,"priceDz":0.07,"wastage":51,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RASEL MIA","machine":5},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134250,"unitPrice":0.004583333333333333,"pcs":5540,"usd":25.3917,"priceDz":0.055,"wastage":11,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RASEL MIA","machine":5},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135602,"unitPrice":0.01,"pcs":21000,"usd":210,"priceDz":0.12,"wastage":42,"buyer":"OTCF","customer":"GRAPHICS TEXTILES LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RASEL MIA","machine":5},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134251,"unitPrice":0.004583333333333333,"pcs":12883,"usd":59.0471,"priceDz":0.055,"wastage":26,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMGIR","machine":10},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135393,"unitPrice":0.004583333333333333,"pcs":760,"usd":3.4833,"priceDz":0.055,"wastage":2,"buyer":"OTCF","customer":"MULTIFABS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMGIR","machine":10},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135445,"unitPrice":0.005833333333333334,"pcs":30176,"usd":176.0267,"priceDz":0.07,"wastage":60,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMGIR","machine":10},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135382,"unitPrice":0.0022908333333333335,"pcs":9000,"usd":20.6175,"priceDz":0.02749,"wastage":18,"buyer":"OTCF","customer":"SM KNITWEARS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMGIR","machine":10},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135488,"unitPrice":0.008333333333333333,"pcs":3250,"usd":27.0833,"priceDz":0.1,"wastage":6,"buyer":"WOOLWORTHS","customer":"AMAN KNITTINGS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135487,"unitPrice":0.008333333333333333,"pcs":3250,"usd":27.0833,"priceDz":0.1,"wastage":6,"buyer":"WOOLWORTHS","customer":"AMAN KNITTINGS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135722,"unitPrice":0.020833333333333332,"pcs":1431,"usd":29.8125,"priceDz":0.25,"wastage":3,"buyer":"LINDEX","customer":"APEX TEXTILE PRINTING MILLS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135484,"unitPrice":0.008333333333333333,"pcs":4932,"usd":41.1,"priceDz":0.1,"wastage":10,"buyer":"WOOLWORTHS","customer":"AMAN KNITTINGS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135460,"unitPrice":0.013333333333333334,"pcs":10586,"usd":141.1467,"priceDz":0.16,"wastage":21,"buyer":"WOOLWORTHS","customer":"CONTINENTAL GARMENTS IND. (PVT.) LTD. ","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134909,"unitPrice":0.008333333333333333,"pcs":8560,"usd":71.3333,"priceDz":0.1,"wastage":17,"buyer":"SIUX","customer":"FASHION ASIA LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135743,"unitPrice":0.015,"pcs":5000,"usd":75,"priceDz":0.18,"wastage":10,"buyer":"WOOLWORTHS","customer":"POWERTEX FASHIONS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"OMAR FARUK","machine":1},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134979,"unitPrice":0.01,"pcs":95000,"usd":950,"priceDz":0.12,"wastage":190,"buyer":"SIGNET ENTERPRISE","customer":"MARMA COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RUHUL AMIN","machine":22},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":120000,"usd":888,"priceDz":0.0888,"wastage":240,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHANGIR","machine":18},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135214,"unitPrice":0.0074,"pcs":42372,"usd":313.5528,"priceDz":0.0888,"wastage":85,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHANGIR","machine":18},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135214,"unitPrice":0.0074,"pcs":52372,"usd":387.5528,"priceDz":0.0888,"wastage":105,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SAMSUDDIN","machine":20},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135794,"unitPrice":0.0074,"pcs":30000,"usd":222,"priceDz":0.0888,"wastage":60,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SAMSUDDIN","machine":20},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":"SHORT","unitPrice":0,"pcs":5000,"usd":0,"priceDz":null,"wastage":10,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SAMSUDDIN","machine":20},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":140000,"usd":1036,"priceDz":0.0888,"wastage":280,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SUJON","machine":19},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134254,"unitPrice":0.004625,"pcs":31865,"usd":147.3756,"priceDz":0.0555,"wastage":64,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"TOIBUR","machine":17},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135330,"unitPrice":0.004625,"pcs":8089,"usd":37.4116,"priceDz":0.0555,"wastage":16,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"TOIBUR","machine":17},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":134243,"unitPrice":0.004625,"pcs":3450,"usd":15.9562,"priceDz":0.0555,"wastage":7,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"TOIBUR","machine":17},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135331,"unitPrice":0.004625,"pcs":4741,"usd":21.9271,"priceDz":0.0555,"wastage":9,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"TOIBUR","machine":17},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135457,"unitPrice":0.0074,"pcs":133514,"usd":988.0036,"priceDz":0.0888,"wastage":267,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMIN","machine":16},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135214,"unitPrice":0.0074,"pcs":10000,"usd":74,"priceDz":0.0888,"wastage":20,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALAMIN","machine":16},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135803,"unitPrice":0.006600000000000001,"pcs":37517,"usd":247.6122,"priceDz":0.0792,"wastage":75,"buyer":"PEPCO","customer":"RAM APPAREL LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JIBON SARKER","machine":15},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135767,"unitPrice":0.006600000000000001,"pcs":69376,"usd":457.8816,"priceDz":0.0792,"wastage":139,"buyer":"PEPCO","customer":"TIVOLI APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JIBON SARKER","machine":15},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135524,"unitPrice":0.009166666666666667,"pcs":1383,"usd":12.6775,"priceDz":0.11,"wastage":3,"buyer":"DIMENSION","customer":"AKH ECO APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHID HASAN","machine":12},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135378,"unitPrice":0.009166666666666667,"pcs":1627,"usd":14.9142,"priceDz":0.11,"wastage":4,"buyer":"DIMENSION","customer":"AKH ECO APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHID HASAN","machine":12},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135425,"unitPrice":0.009166666666666667,"pcs":3703,"usd":33.9442,"priceDz":0.11,"wastage":7,"buyer":"DIMENSION","customer":"AKH ECO APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHID HASAN","machine":12},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-A","jobNumber":135478,"unitPrice":0.005833333333333334,"pcs":5085,"usd":29.6625,"priceDz":0.07,"wastage":10,"buyer":"C&A","customer":"JAY JAY MILLS (BANGLADESH) PRIVATE LTD ","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAHID HASAN","machine":12},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135753,"unitPrice":0.0074,"pcs":67490,"usd":499.426,"priceDz":0.0888,"wastage":135,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAKIBUL","machine":18},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135975,"unitPrice":0.0074,"pcs":45000,"usd":333,"priceDz":0.0888,"wastage":90,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAKIBUL","machine":18},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135753,"unitPrice":0.0074,"pcs":100000,"usd":740,"priceDz":0.0888,"wastage":200,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"FARUK","machine":20},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135975,"unitPrice":0.0074,"pcs":50000,"usd":370,"priceDz":0.0888,"wastage":100,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"FARUK","machine":20},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135975,"unitPrice":0.0074,"pcs":125000,"usd":925,"priceDz":0.0888,"wastage":250,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD AZAD","machine":3},{"date":"2026-09-01","mcType":"Flexo","jobType":"3 color","shift":"Shift-B","jobNumber":135753,"unitPrice":0.0074,"pcs":115000,"usd":851,"priceDz":0.0888,"wastage":230,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ARSHAD HOSSAIN","machine":16},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":127599,"unitPrice":0.0075,"pcs":40000,"usd":300,"priceDz":0.09,"wastage":80,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAMRUL","machine":1},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":127596,"unitPrice":0.0075,"pcs":70000,"usd":525,"priceDz":0.09,"wastage":140,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAMRUL","machine":1},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":134992,"unitPrice":0.005,"pcs":49685,"usd":248.425,"priceDz":0.06,"wastage":99,"buyer":"SIGNET ENTERPRISE","customer":"MARMA COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ERSHAD ALI","machine":2},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":135073,"unitPrice":0.005,"pcs":5835,"usd":29.175,"priceDz":0.06,"wastage":12,"buyer":"SIGNET ENTERPRISE","customer":"MARMA COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ERSHAD ALI","machine":2},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":135035,"unitPrice":0.0033333333333333335,"pcs":3308,"usd":11.0267,"priceDz":0.04,"wastage":7,"buyer":"SIGNET ENTERPRISE","customer":"MAVIS GARMENTS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ERSHAD ALI","machine":2},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":135040,"unitPrice":0.0033333333333333335,"pcs":2783,"usd":9.2767,"priceDz":0.04,"wastage":5,"buyer":"SIGNET ENTERPRISE","customer":"MAVIS GARMENTS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ERSHAD ALI","machine":2},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":135043,"unitPrice":0.0033333333333333335,"pcs":550,"usd":1.8333,"priceDz":0.04,"wastage":2,"buyer":"SIGNET ENTERPRISE","customer":"MAVIS GARMENTS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ERSHAD ALI","machine":2},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":127599,"unitPrice":0.0075,"pcs":40000,"usd":300,"priceDz":0.09,"wastage":80,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SIRAJUL","machine":4},{"date":"2026-09-01","mcType":"Nylo","jobType":"5 color","shift":"Shift-A","jobNumber":127596,"unitPrice":0.0075,"pcs":60000,"usd":450,"priceDz":0.09,"wastage":120,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SIRAJUL","machine":4},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135827,"unitPrice":0.012499999999999999,"pcs":31200,"usd":390.0,"priceDz":0.15,"wastage":62,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":1},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135828,"unitPrice":0.012499999999999999,"pcs":31200,"usd":390.0,"priceDz":0.15,"wastage":62,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":1},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135731,"unitPrice":0.013333333333333334,"pcs":156,"usd":2.08,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135731,"unitPrice":0.013333333333333334,"pcs":209,"usd":2.7867,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135728,"unitPrice":0.013333333333333334,"pcs":240,"usd":3.2,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135204,"unitPrice":0.013333333333333334,"pcs":206,"usd":2.7467,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"VOYAGER APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135203,"unitPrice":0.013333333333333334,"pcs":228,"usd":3.04,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"VOYAGER APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135729,"unitPrice":0.013333333333333334,"pcs":242,"usd":3.2267,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135730,"unitPrice":0.013333333333333334,"pcs":206,"usd":2.7467,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135732,"unitPrice":0.013333333333333334,"pcs":293,"usd":3.9067,"priceDz":0.16,"wastage":2,"buyer":"TENDAM","customer":"BIG BOSS CORPORATION LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":135781,"unitPrice":0.015833333333333335,"pcs":12771,"usd":202.2075,"priceDz":0.19,"wastage":25,"buyer":"TERRANOVA","customer":"FAME APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD RAJU AHMED","machine":2},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134800,"unitPrice":0.002416666666666667,"pcs":34000,"usd":82.1667,"priceDz":0.029,"wastage":68,"buyer":"TENDAM","customer":"RENAISSANCE APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MONIR","machine":4},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134396,"unitPrice":0.01,"pcs":150,"usd":1.5,"priceDz":0.12,"wastage":2,"buyer":"TERRANOVA","customer":"ENTRUST FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MANIK","machine":5},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134973,"unitPrice":0.02,"pcs":20500,"usd":410,"priceDz":0.24,"wastage":41,"buyer":"TESCO","customer":"UTAH FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MANIK","machine":5},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134822,"unitPrice":0.023333333333333334,"pcs":15000,"usd":350,"priceDz":0.28,"wastage":30,"buyer":"DMR","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"DOP- MD ARFURL","machine":null},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134822,"unitPrice":0.023333333333333334,"pcs":15000,"usd":350,"priceDz":0.28,"wastage":30,"buyer":"DMR","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"DOP- MD RASEL AHMED","machine":null},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":68042,"unitPrice":0,"pcs":3200,"usd":0,"priceDz":null,"wastage":6,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"DOP- MD FIROZ AHMED","machine":null},{"date":"2026-09-01","mcType":"Auto-Screen","jobType":null,"shift":"Shift-A","jobNumber":134822,"unitPrice":0.023333333333333334,"pcs":12443,"usd":290.3367,"priceDz":0.28,"wastage":25,"buyer":"DMR","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"DOP- MD FIROZ AHMED","machine":null},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135711,"unitPrice":0,"pcs":28800,"usd":0,"priceDz":null,"wastage":58,"buyer":"PEPCO","customer":"IRIS DESIGN LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ROBIUL ISLAM","machine":1},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":103000,"usd":0,"priceDz":null,"wastage":206,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD ROBIUL ISLAM","machine":1},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135771,"unitPrice":0,"pcs":77340,"usd":0,"priceDz":null,"wastage":155,"buyer":"LINDEX","customer":"FOUR H APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHINUR RAHMAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135759,"unitPrice":0,"pcs":9210,"usd":0,"priceDz":null,"wastage":18,"buyer":"LINDEX","customer":"CHERRY INTIMATE LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHINUR RAHMAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134909,"unitPrice":0,"pcs":20000,"usd":0,"priceDz":null,"wastage":40,"buyer":"SIUX","customer":"FASHION ASIA LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD SHAHINUR RAHMAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135711,"unitPrice":0,"pcs":30400,"usd":0,"priceDz":null,"wastage":61,"buyer":"PEPCO","customer":"IRIS DESIGN LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":132890,"unitPrice":0,"pcs":2370,"usd":0,"priceDz":null,"wastage":5,"buyer":"LERROS","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":22000,"usd":0,"priceDz":null,"wastage":44,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135745,"unitPrice":0,"pcs":223,"usd":0,"priceDz":null,"wastage":2,"buyer":"KONTOOR","customer":"JEANS PLUS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135294,"unitPrice":0,"pcs":957,"usd":0,"priceDz":null,"wastage":2,"buyer":"KONTOOR","customer":"DEKKO FASHIONS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135292,"unitPrice":0,"pcs":1760,"usd":0,"priceDz":null,"wastage":4,"buyer":"ICA","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD RUBEL MIA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135211,"unitPrice":0,"pcs":22280,"usd":0,"priceDz":null,"wastage":44,"buyer":"SIGNET ENTERPRISE","customer":"MARMA COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MEHEDI HASAN","machine":6},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134030,"unitPrice":0,"pcs":4281,"usd":0,"priceDz":null,"wastage":8,"buyer":"TERRANOVA","customer":"ENTRUST FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MEHEDI HASAN","machine":6},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134438,"unitPrice":0,"pcs":6008,"usd":0,"priceDz":null,"wastage":12,"buyer":"JOHN LEWIS","customer":"AKH KNITTING & DYEING LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MEHEDI HASAN","machine":6},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134405,"unitPrice":0,"pcs":10403,"usd":0,"priceDz":null,"wastage":21,"buyer":"JOHN LEWIS","customer":"AKH KNITTING & DYEING LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MEHEDI HASAN","machine":6},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134440,"unitPrice":0,"pcs":3472,"usd":0,"priceDz":null,"wastage":7,"buyer":"JOHN LEWIS","customer":"AKH KNITTING & DYEING LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD MEHEDI HASAN","machine":6},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135711,"unitPrice":0,"pcs":30730,"usd":0,"priceDz":null,"wastage":61,"buyer":"PEPCO","customer":"IRIS DESIGN LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD IMRAN HASAN","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":46310,"usd":0,"priceDz":null,"wastage":93,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"T- MD IMRAN HASAN","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135703,"unitPrice":0,"pcs":1050,"usd":0,"priceDz":null,"wastage":3,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135700,"unitPrice":0,"pcs":2210,"usd":0,"priceDz":null,"wastage":4,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135701,"unitPrice":0,"pcs":3520,"usd":0,"priceDz":null,"wastage":7,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135702,"unitPrice":0,"pcs":980,"usd":0,"priceDz":null,"wastage":2,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135594,"unitPrice":0,"pcs":830,"usd":0,"priceDz":null,"wastage":2,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135540,"unitPrice":0,"pcs":110,"usd":0,"priceDz":null,"wastage":2,"buyer":"DIMENSION","customer":"SOUTH EAST TEXTILES (PVT.) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135424,"unitPrice":0,"pcs":300,"usd":0,"priceDz":null,"wastage":2,"buyer":"DIMENSION","customer":"AKH ECO APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KAWSAR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135795,"unitPrice":0,"pcs":27500,"usd":0,"priceDz":null,"wastage":55,"buyer":"PEPCO","customer":"OISHI FASHION (PVT) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANOWAR","machine":1},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135446,"unitPrice":0,"pcs":9142,"usd":0,"priceDz":null,"wastage":18,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANOWAR","machine":1},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135707,"unitPrice":0,"pcs":3000,"usd":0,"priceDz":null,"wastage":6,"buyer":"KONTOOR","customer":"COTTON CLOTHING (BD) LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ABU HARES","machine":5},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135828,"unitPrice":0,"pcs":16000,"usd":0,"priceDz":null,"wastage":32,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ABU HARES","machine":5},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135826,"unitPrice":0,"pcs":10000,"usd":0,"priceDz":null,"wastage":20,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ABU HARES","machine":5},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135827,"unitPrice":0,"pcs":15000,"usd":0,"priceDz":null,"wastage":30,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ABU HARES","machine":5},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135795,"unitPrice":0,"pcs":40000,"usd":0,"priceDz":null,"wastage":80,"buyer":"PEPCO","customer":"OISHI FASHION (PVT) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"PROSENJIT","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135767,"unitPrice":0,"pcs":10000,"usd":0,"priceDz":null,"wastage":20,"buyer":"PEPCO","customer":"TIVOLI APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"PROSENJIT","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135650,"unitPrice":0,"pcs":6180,"usd":0,"priceDz":null,"wastage":12,"buyer":"WOOLWORTHS","customer":"UNIVERSAL MENSWEAR LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135448,"unitPrice":0,"pcs":3090,"usd":0,"priceDz":null,"wastage":6,"buyer":"PEPCO","customer":"IRIS DESIGN LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135794,"unitPrice":0,"pcs":16000,"usd":0,"priceDz":null,"wastage":32,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":16000,"usd":0,"priceDz":null,"wastage":32,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135214,"unitPrice":0,"pcs":14000,"usd":0,"priceDz":null,"wastage":28,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135528,"unitPrice":0,"pcs":63471,"usd":0,"priceDz":null,"wastage":127,"buyer":"HENBURY","customer":"KNIT PLUS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD JAHANGIR","machine":3},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":133800,"unitPrice":0,"pcs":16950,"usd":0,"priceDz":null,"wastage":34,"buyer":"OTCF","customer":"RADIAL INTERNATIONAL UNIT 2 LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MARUF","machine":23},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":127599,"unitPrice":0,"pcs":41000,"usd":0,"priceDz":null,"wastage":82,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MARUF","machine":23},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":127596,"unitPrice":0,"pcs":25000,"usd":0,"priceDz":null,"wastage":50,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MARUF","machine":23},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135751,"unitPrice":0,"pcs":25000,"usd":0,"priceDz":null,"wastage":50,"buyer":"PEPCO","customer":"OISHI FASHION (PVT) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MAHIUDDIN","machine":28},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135803,"unitPrice":0,"pcs":33600,"usd":0,"priceDz":null,"wastage":67,"buyer":"PEPCO","customer":"RAM APPAREL LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MAHIUDDIN","machine":28},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":"SAMPLE","unitPrice":0,"pcs":32000,"usd":0,"priceDz":null,"wastage":64,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"AMINUL 1","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135803,"unitPrice":0,"pcs":16000,"usd":0,"priceDz":null,"wastage":32,"buyer":"PEPCO","customer":"RAM APPAREL LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ATIK","machine":29},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135751,"unitPrice":0,"pcs":11400,"usd":0,"priceDz":null,"wastage":23,"buyer":"PEPCO","customer":"OISHI FASHION (PVT) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ATIK","machine":29},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":137596,"unitPrice":0,"pcs":26000,"usd":0,"priceDz":null,"wastage":52,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ATIK","machine":29},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134065,"unitPrice":0,"pcs":49200,"usd":0,"priceDz":null,"wastage":98,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MEHEDI","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135975,"unitPrice":0,"pcs":65000,"usd":0,"priceDz":null,"wastage":130,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MEHEDI","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135755,"unitPrice":0,"pcs":8000,"usd":0,"priceDz":null,"wastage":16,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MEHEDI","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134800,"unitPrice":0,"pcs":34000,"usd":0,"priceDz":null,"wastage":68,"buyer":"TENDAM","customer":"RENAISSANCE APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKARIA 1","machine":8},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135835,"unitPrice":0,"pcs":6330,"usd":0,"priceDz":null,"wastage":13,"buyer":"RENFOLD","customer":"NETWORK CLOTHING LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKARIA 1","machine":8},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135426,"unitPrice":0,"pcs":1700,"usd":0,"priceDz":null,"wastage":4,"buyer":"TENDAM","customer":"PURBACHAL APPAREL LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":137599,"unitPrice":0,"pcs":7700,"usd":0,"priceDz":null,"wastage":15,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":137596,"unitPrice":0,"pcs":15000,"usd":0,"priceDz":null,"wastage":30,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135787,"unitPrice":0,"pcs":1400,"usd":0,"priceDz":null,"wastage":3,"buyer":"TBH GLOBAL","customer":"NORBAN COMTEX LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135528,"unitPrice":0,"pcs":42000,"usd":0,"priceDz":null,"wastage":84,"buyer":"HENBURY","customer":"KNIT PLUS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":"SAMPLE","unitPrice":0,"pcs":1000,"usd":0,"priceDz":null,"wastage":2,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"RAKIBUL","machine":25},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134078,"unitPrice":0,"pcs":20000,"usd":0,"priceDz":null,"wastage":40,"buyer":"PEPCO","customer":"KC BOTTOM AND SHIRT WEAR COMPANY","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKIR","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135386,"unitPrice":0,"pcs":7000,"usd":0,"priceDz":null,"wastage":14,"buyer":"OTCF","customer":"SM KNITWEARS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKIR","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":142000,"usd":0,"priceDz":null,"wastage":284,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKIR","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135753,"unitPrice":0,"pcs":27000,"usd":0,"priceDz":null,"wastage":54,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKIR","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134531,"unitPrice":0,"pcs":8000,"usd":0,"priceDz":null,"wastage":16,"buyer":"JOHN LEWIS","customer":"ENERGYPAC FASHIONS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"POLIN","machine":20},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135327,"unitPrice":0,"pcs":24980,"usd":0,"priceDz":null,"wastage":50,"buyer":"TOKMANNI","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"POLIN","machine":20},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135328,"unitPrice":0,"pcs":17800,"usd":0,"priceDz":null,"wastage":36,"buyer":"TOKMANNI","customer":"ALIM KNIT (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"POLIN","machine":20},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134822,"unitPrice":0,"pcs":38000,"usd":0,"priceDz":null,"wastage":76,"buyer":"DMR","customer":"COTTON FIELD (BD) LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ABU MUSA","machine":4},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134248,"unitPrice":0,"pcs":18000,"usd":0,"priceDz":null,"wastage":36,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135393,"unitPrice":0,"pcs":1500,"usd":0,"priceDz":null,"wastage":3,"buyer":"OTCF","customer":"MULTIFABS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134239,"unitPrice":0,"pcs":1200,"usd":0,"priceDz":null,"wastage":3,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134967,"unitPrice":0,"pcs":500,"usd":0,"priceDz":null,"wastage":2,"buyer":"OTCF","customer":"NEW ASIA FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135794,"unitPrice":0,"pcs":13000,"usd":0,"priceDz":null,"wastage":26,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135446,"unitPrice":0,"pcs":18930,"usd":0,"priceDz":null,"wastage":38,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SANNY AHASAN","machine":2},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135781,"unitPrice":0,"pcs":8000,"usd":0,"priceDz":null,"wastage":16,"buyer":"TERRANOVA","customer":"FAME APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SHYMOL BABU","machine":null},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135446,"unitPrice":0,"pcs":18000,"usd":0,"priceDz":null,"wastage":36,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SHYMOL BABU","machine":null},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134251,"unitPrice":0,"pcs":12500,"usd":0,"priceDz":null,"wastage":25,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SHYMOL BABU","machine":null},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135444,"unitPrice":0,"pcs":23850,"usd":0,"priceDz":null,"wastage":48,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"KRISHNA","machine":15},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135393,"unitPrice":0,"pcs":2580,"usd":0,"priceDz":null,"wastage":5,"buyer":"OTCF","customer":"MULTIFABS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"KRISHNA","machine":15},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135214,"unitPrice":0,"pcs":106870,"usd":0,"priceDz":null,"wastage":214,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"KRISHNA","machine":15},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":10000,"usd":0,"priceDz":null,"wastage":20,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"KRISHNA","machine":15},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135393,"unitPrice":0,"pcs":9700,"usd":0,"priceDz":null,"wastage":19,"buyer":"OTCF","customer":"MULTIFABS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALOMGIR 1","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135794,"unitPrice":0,"pcs":20300,"usd":0,"priceDz":null,"wastage":41,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALOMGIR 1","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":9400,"usd":0,"priceDz":null,"wastage":19,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALOMGIR 1","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":11200,"usd":0,"priceDz":null,"wastage":22,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALOMGIR 1","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135753,"unitPrice":0,"pcs":15200,"usd":0,"priceDz":null,"wastage":30,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"ALOMGIR 1","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135907,"unitPrice":0,"pcs":10400,"usd":0,"priceDz":null,"wastage":21,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KIRON","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135828,"unitPrice":0,"pcs":31200,"usd":0,"priceDz":null,"wastage":62,"buyer":"STRADIVARIUS","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KIRON","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135718,"unitPrice":0,"pcs":5000,"usd":0,"priceDz":null,"wastage":10,"buyer":"RENFOLD","customer":"KNITTEX INDUSTRIES LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KIRON","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":"SAMPLE","unitPrice":0,"pcs":100,"usd":0,"priceDz":null,"wastage":2,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KIRON","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135765,"unitPrice":0,"pcs":4000,"usd":0,"priceDz":null,"wastage":8,"buyer":"ERNSTING'S FAMILY","customer":"H.I. APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD KIRON","machine":21},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134254,"unitPrice":0,"pcs":15492,"usd":0,"priceDz":null,"wastage":31,"buyer":"OTCF","customer":"MUAZUDDIN TEXTILE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD BALAL","machine":12},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135528,"unitPrice":0,"pcs":16495,"usd":0,"priceDz":null,"wastage":33,"buyer":"HENBURY","customer":"KNIT PLUS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD BALAL","machine":12},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135765,"unitPrice":0,"pcs":28140,"usd":0,"priceDz":null,"wastage":56,"buyer":"ERNSTING'S FAMILY","customer":"H.I. APPARELS LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD BALAL","machine":12},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135387,"unitPrice":0,"pcs":9530,"usd":0,"priceDz":null,"wastage":19,"buyer":"OTCF","customer":"SM KNITWEARS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAKIL","machine":9},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135794,"unitPrice":0,"pcs":9200,"usd":0,"priceDz":null,"wastage":18,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAKIL","machine":9},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":96900,"usd":0,"priceDz":null,"wastage":194,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAKIL","machine":9},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135214,"unitPrice":0,"pcs":38500,"usd":0,"priceDz":null,"wastage":77,"buyer":"PEPCO","customer":"KAIZER KNIT WEARS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHAKIL","machine":9},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":127599,"unitPrice":0,"pcs":42000,"usd":0,"priceDz":null,"wastage":84,"buyer":"TENDAM","customer":"MONDOL FABRICS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SHUKUR","machine":22},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":127596,"unitPrice":0,"pcs":83000,"usd":0,"priceDz":null,"wastage":166,"buyer":null,"customer":null,"startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD SHUKUR","machine":22},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":140000,"usd":0,"priceDz":null,"wastage":280,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"AMIRUL","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135753,"unitPrice":0,"pcs":15000,"usd":0,"priceDz":null,"wastage":30,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"AMIRUL","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135794,"unitPrice":0,"pcs":20000,"usd":0,"priceDz":null,"wastage":40,"buyer":"PEPCO","customer":"MANEL FASHION LIMITED","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"AMIRUL","machine":18},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":134078,"unitPrice":0,"pcs":8723,"usd":0,"priceDz":null,"wastage":17,"buyer":"PEPCO","customer":"KC BOTTOM AND SHIRT WEAR COMPANY","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MESER ALI","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135388,"unitPrice":0,"pcs":9411,"usd":0,"priceDz":null,"wastage":19,"buyer":"OTCF","customer":"SM KNITWEARS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MESER ALI","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":140905,"usd":0,"priceDz":null,"wastage":282,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MESER ALI","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":16176,"usd":0,"priceDz":null,"wastage":32,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MESER ALI","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135755,"unitPrice":0,"pcs":6649,"usd":0,"priceDz":null,"wastage":13,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD MESER ALI","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135444,"unitPrice":0,"pcs":22000,"usd":0,"priceDz":null,"wastage":44,"buyer":"OTCF","customer":"SHAMSER KNIT FASHIONS LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ASHIK","machine":17},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135457,"unitPrice":0,"pcs":145000,"usd":0,"priceDz":null,"wastage":290,"buyer":"PEPCO","customer":"SISAL COMPOSITE LTD.","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ASHIK","machine":17},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-A","jobNumber":135754,"unitPrice":0,"pcs":16000,"usd":0,"priceDz":null,"wastage":32,"buyer":"PEPCO","customer":"TRIPLE SEVEN APPARELS LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD ASHIK","machine":17},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-B","jobNumber":135753,"unitPrice":0,"pcs":84000,"usd":0,"priceDz":null,"wastage":168,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKARIA 2","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-B","jobNumber":135975,"unitPrice":0,"pcs":25000,"usd":0,"priceDz":null,"wastage":50,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"JAKARIA 2","machine":10},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-B","jobNumber":135753,"unitPrice":0,"pcs":123500,"usd":0,"priceDz":null,"wastage":247,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"MD TOUHIDUL ISLAM","machine":11},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-B","jobNumber":135975,"unitPrice":0,"pcs":17000,"usd":0,"priceDz":null,"wastage":34,"buyer":"PEPCO","customer":"KNIT CONCERN LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHOFIKUL","machine":19},{"date":"2026-09-01","mcType":"Cutting","jobType":null,"shift":"Shift-B","jobNumber":135753,"unitPrice":0,"pcs":112000,"usd":0,"priceDz":null,"wastage":224,"buyer":"PEPCO","customer":"KC PRINT LTD","startTime":"07:30","endTime":"07:30","breakdown":0,"operator":"SHOFIKUL","machine":19}];

/* ============================== CONSTANTS ============================== */
const NAV = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "daily", label: "Daily / Monthly / Yearly", icon: Calendar },
  { key: "dailyplan", label: "Daily Plan", icon: ClipboardList },
  { key: "ot", label: "OT", icon: Printer },
  { key: "operators", label: "Operator Performance", icon: Users },
  { key: "machines", label: "Machine Performance", icon: Cog },
  { key: "mctype", label: "MC Type Performance", icon: Cog },
  { key: "shift", label: "Shift Analysis", icon: Sun },
  { key: "buyers", label: "Buyer Analysis", icon: ShoppingBag },
  { key: "customers", label: "Customer Analysis", icon: Building2 },
  { key: "jobs", label: "Job Analysis", icon: Search },
  { key: "wastage", label: "Wastage & Breakdown", icon: AlertTriangle },
  { key: "table", label: "Data Table", icon: Table2 },
  { key: "import", label: "Import Data", icon: Upload, permission: "import_data" },
  { key: "settings", label: "Settings", icon: SettingsIcon },
  { key: "users", label: "User Management", icon: UserCog, permission: "manage_users" },
];

const COLORS = ["#2563eb", "#0891b2", "#7c3aed", "#d97706", "#059669", "#dc2626", "#4f46e5", "#0d9488"];
// The five supervisors who submit a Daily Plan — matches the `supervisor_name`
// check constraint in supabase/daily_plan.sql. Add a name in both places to extend.
const SUPERVISORS = ["Aslam", "Murad", "Biplob", "Selim Reza", "Shahjahan"];
const INK = "#1e293b";
const MUTE = "#64748b";
const LINE = "#e2e8f0";

const fmtInt = (n) => (n == null || isNaN(n) ? "—" : Math.round(n).toLocaleString("en-US"));
const fmtUsd = (n, cur = "USD") =>
  n == null || isNaN(n) ? "—" : (cur === "USD" ? "$" : cur + " ") + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (n == null || isNaN(n) ? "—" : n.toFixed(1) + "%");
// Dates are stored as plain "YYYY-MM-DD" strings (see src/lib/dateUtils.js).
// Display is pure string formatting — never routed through `new Date(...)` —
// so there is no timezone-driven day shift possible.
function todayDhakaISO() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
const fmtDate = (d) => formatDisplayDate(d);

function monthKey(dateStr) { return monthKeyOf(dateStr); }
function yearKey(dateStr) { return yearKeyOf(dateStr); }

function uniqSorted(arr) { return Array.from(new Set(arr.filter((v) => v !== undefined && v !== null && v !== ""))).sort((a, b) => (a > b ? 1 : -1)); }

/* ============================== AGGREGATION ============================== */
// One record already represents an aggregated production entry (job/operator/date).
// We NEVER average row-level values for totals — always SUM, per spec section 32/33.
function aggregate(records) {
  const pcs = records.reduce((s, r) => s + (Number(r.pcs) || 0), 0);
  const usd = records.reduce((s, r) => s + (Number(r.usd) || 0), 0);
  const wastage = records.reduce((s, r) => s + (Number(r.wastage) || 0), 0);
  const breakdown = records.reduce((s, r) => s + (Number(r.breakdown) || 0), 0);
  const dhuVals = records.map((r) => r.dhu).filter((v) => v !== null && v !== undefined && v !== "");
  const avgDhu = dhuVals.length ? dhuVals.reduce((s, v) => s + Number(v), 0) / dhuVals.length : null;
  return { pcs, usd, wastage, breakdown, avgDhu, count: records.length };
}

function groupBy(records, keyFn) {
  const map = new Map();
  for (const r of records) {
    const k = keyFn(r);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(r);
  }
  return map;
}

/* ============================== SMALL UI PRIMITIVES ============================== */
function Card({ children, className = "", padded = true }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub, tone = "default", icon: Icon }) {
  const toneMap = {
    default: "text-slate-900",
    good: "text-emerald-600",
    bad: "text-rose-600",
    warn: "text-amber-600",
  };
  return (
    <Card className="flex flex-col gap-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {Icon && <Icon size={15} className="text-slate-400 shrink-0" />}
      </div>
      <span className={`text-2xl font-bold tabular-nums truncate ${toneMap[tone]}`}>{value}</span>
      {sub && <span className="text-xs text-slate-400">{sub}</span>}
    </Card>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-slate-800">{children}</h2>
      {right}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "Target Achieved": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Near Target": "bg-amber-50 text-amber-700 border-amber-200",
    "Below $400": "bg-rose-50 text-rose-700 border-rose-200",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>{status}</span>;
}

function EmptyState({ text }) {
  return <div className="text-sm text-slate-400 italic py-8 text-center">{text}</div>;
}

/* Sortable / searchable / paginated table */
function DataTable({ columns, rows, pageSize = 12, initialSort }) {
  const [sort, setSort] = useState(initialSort || { key: columns[0].key, dir: "asc" });
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(needle)));
  }, [rows, q, columns]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va ?? "").localeCompare(String(vb ?? "")) : String(vb ?? "").localeCompare(String(va ?? ""));
    });
    return arr;
  }, [filtered, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="relative w-56">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search..."
            className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>
        <span className="text-xs text-slate-400">{sorted.length} records</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)}
                  className="text-left px-3 py-2 font-semibold text-slate-600 whitespace-nowrap cursor-pointer select-none hover:text-slate-900">
                  <span className="inline-flex items-center gap-1">{c.label}
                    {sort.key === c.key ? (sort.dir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ArrowUpDown size={10} className="opacity-30" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length}><EmptyState text="No matching records" /></td></tr>
            )}
            {pageRows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-end gap-2 mt-2 text-xs text-slate-500">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30">Prev</button>
          <span>Page {page + 1} of {pageCount}</span>
          <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded border border-slate-200 disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children, height = 260 }) {
  return (
    <Card>
      <div className="text-sm font-semibold text-slate-700 mb-3">{title}</div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </Card>
  );
}

/* Generic filter select */
function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function downloadCsv(filename, rows, columns) {
  const header = columns.map((c) => c.label).join(",");
  const lines = rows.map((r) => columns.map((c) => {
    const v = c.raw ? c.raw(r) : r[c.key];
    const s = v == null ? "" : String(v);
    return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(","));
  const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Supabase <-> app record mapping ---------- */
// The app's internal record shape (camelCase, matches the original design)
// is kept unchanged; these two functions are the only place that translate
// to/from the `production_data` table's snake_case columns.
function dbRowToRecord(row) {
  return {
    id: row.id,
    date: row.report_date, // already "YYYY-MM-DD" — Postgres DATE serializes this way
    mcType: row.mc_type,
    jobType: null,
    shift: row.shift,
    jobNumber: row.job_number,
    unitPrice: row.unit_price,
    pcs: row.production_pcs,
    usd: row.production_usd,
    priceDz: row.price_per_dz,
    buyer: row.buyer_name,
    customer: row.customer_name,
    operator: row.operator_name,
    machine: row.machine_no,
    target: row.target_usd,
    dhu: row.dhu_percent,
    wastage: row.wastage,
    breakdown: row.machine_breakdown,
    remarks: row.remarks,
  };
}
function recordToDbRow(rec, userId) {
  return {
    report_date: rec.date,
    mc_type: rec.mcType || null,
    shift: rec.shift || null,
    job_number: rec.jobNumber != null ? String(rec.jobNumber) : null,
    unit_price: rec.unitPrice ?? null,
    production_pcs: rec.pcs || 0,
    production_usd: rec.usd || 0,
    price_per_dz: rec.priceDz ?? null,
    buyer_name: rec.buyer || null,
    customer_name: rec.customer || null,
    operator_name: rec.operator,
    machine_no: rec.machine != null ? String(rec.machine) : null,
    target_usd: rec.target ?? null,
    dhu_percent: rec.dhu ?? null,
    wastage: rec.wastage || 0,
    machine_breakdown: rec.breakdown || 0,
    remarks: rec.remarks || null,
    created_by: userId || null,
  };
}

/* ============================== MAIN APP ============================== */
export default function PFLDashboard({ session, profile, onLogout }) {
  // Database is the source of truth. RAW_DATA (the originally embedded
  // sample) is only used as a local-demo fallback when Supabase isn't
  // configured (no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set yet), so
  // the app still runs out of the box for local development.
  const [rawData, setRawData] = useState(supabaseReady ? [] : RAW_DATA);
  const [dataLoading, setDataLoading] = useState(supabaseReady);
  const [dataError, setDataError] = useState("");
  const [page, setPage] = useState("overview");
  const [navOpen, setNavOpen] = useState(false);

  const [settings, setSettings] = useState({
    dailyTarget: 28000,  // requirement #9 — global daily production target (USD)
    belowTarget: 400,    // original per-operator/day threshold — preserved
    nearTargetPct: 90,
    dhuWarn: 2,
    dhuCrit: 4,
    currency: "USD",
  });

  // OT Ready-to-Print documents are stored in this browser; no DB/schema change is required.
  const [otDocuments, setOtDocuments] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pfl_ot_documents") || "[]"); } catch { return []; }
  });
  const saveOtDocument = useCallback((doc) => {
    setOtDocuments(prev => {
      const next = [doc, ...prev.filter(x => x.id !== doc.id)].slice(0, 50);
      localStorage.setItem("pfl_ot_documents", JSON.stringify(next));
      return next;
    });
  }, []);
  const deleteOtDocument = useCallback((id) => {
    setOtDocuments(prev => {
      const next = prev.filter(x => x.id !== id);
      localStorage.setItem("pfl_ot_documents", JSON.stringify(next));
      return next;
    });
  }, []);

  const [filters, setFilters] = useState({
    datePreset: "all", startDate: "", endDate: "",
    operator: "", mcType: "", shift: "", jobNumber: "", buyer: "", customer: "", machine: "",
  });
  const [selectedOperator, setSelectedOperator] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState(null); // parsed+validated rows awaiting Submit
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  /* ---------- load from Supabase (source of truth) ---------- */
  const fetchFromDatabase = useCallback(async () => {
    if (!supabaseReady) return;
    setDataLoading(true);
    setDataError("");
    const PAGE_SIZE = 1000;
    const allRows = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("production_data")
        .select("*")
        .order("report_date", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) {
        setDataError(`Failed to load data from database: ${error.message}`);
        setDataLoading(false);
        return;
      }
      allRows.push(...(data || []));
      if (!data || data.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
    setRawData(allRows.map(dbRowToRecord));
    setDataLoading(false);
  }, []);

  useEffect(() => {
    fetchFromDatabase();
    const timer = setInterval(() => fetchFromDatabase(), 30000);
    const onFocus = () => fetchFromDatabase();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [fetchFromDatabase]);

  /* ---------- Daily Plan (Aslam/Murad/Biplob/Selim Reza/Shahjahan) ---------- */
  const [dailyPlans, setDailyPlans] = useState([]); // raw rows: {id, plan_date, supervisor_name, planned_usd}
  const [planLoading, setPlanLoading] = useState(supabaseReady);
  const [planError, setPlanError] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planSavedMsg, setPlanSavedMsg] = useState("");

  const fetchDailyPlans = useCallback(async () => {
    if (!supabaseReady) return;
    setPlanLoading(true);
    setPlanError("");
    const { data, error } = await supabase.from("daily_plans").select("*").order("plan_date", { ascending: false });
    if (error) { setPlanError(`Failed to load daily plans: ${error.message}`); setPlanLoading(false); return; }
    setDailyPlans(data);
    setPlanLoading(false);
  }, []);

  useEffect(() => { fetchDailyPlans(); }, [fetchDailyPlans]);

  async function submitDailyPlan(planDate, values) {
    // `values` is { Aslam: 1200, Murad: 900, ... } — only supervisors with a
    // non-empty value are saved. Upsert on (plan_date, supervisor_name) means
    // re-submitting the same date just updates each supervisor's number.
    if (!supabaseReady) { setPlanError("Supabase is not configured — Daily Plan cannot be saved."); return; }
    const rows = SUPERVISORS
      .filter((name) => values[name] !== "" && values[name] !== null && values[name] !== undefined)
      .map((name) => ({
        plan_date: planDate,
        supervisor_name: name,
        planned_usd: Number(values[name]) || 0,
        created_by: session?.user?.id || null,
      }));
    if (!rows.length) return;
    setPlanSaving(true);
    setPlanError("");
    setPlanSavedMsg("");
    const { error } = await supabase.from("daily_plans").upsert(rows, { onConflict: "plan_date,supervisor_name" });
    setPlanSaving(false);
    if (error) { setPlanError(`Database insert failed: ${error.message}`); return; }
    setPlanSavedMsg(`Daily Plan for ${formatDisplayDate(planDate)} saved successfully.`);
    await fetchDailyPlans();
  }

  const allDates = useMemo(() => uniqSorted(rawData.map((r) => r.date)), [rawData]);
  const latestDate = allDates[allDates.length - 1] || null;

  const options = useMemo(() => ({
    operators: uniqSorted(rawData.map((r) => r.operator)),
    mcTypes: uniqSorted(rawData.map((r) => r.mcType)),
    shifts: uniqSorted(rawData.map((r) => r.shift)),
    buyers: uniqSorted(rawData.map((r) => r.buyer)),
    customers: uniqSorted(rawData.map((r) => r.customer)),
    machines: uniqSorted(rawData.map((r) => r.machine)),
  }), [rawData]);

  const dateRange = useMemo(() => {
    if (!latestDate) return null;
    // All arithmetic below is pure calendar math on "YYYY-MM-DD" strings via
    // UTC-anchored helpers (see dateUtils.js) — no local-timezone Date
    // construction/reading mix, so results never shift by a day.
    switch (filters.datePreset) {
      case "today": return [latestDate, latestDate];
      case "yesterday": { const y = addDaysISO(latestDate, -1); return [y, y]; }
      case "thisWeek": return [startOfWeekISO(latestDate), latestDate];
      case "lastWeek": { const s = addDaysISO(startOfWeekISO(latestDate), -7); return [s, addDaysISO(s, 6)]; }
      case "thisMonth": return [startOfMonthISO(latestDate), latestDate];
      case "lastMonth": { const prevEnd = lastDayOfPrevMonthISO(latestDate); return [startOfMonthISO(prevEnd), prevEnd]; }
      case "thisYear": return [startOfYearISO(latestDate), latestDate];
      case "lastYear": { const y = Number(latestDate.slice(0, 4)) - 1; return [`${y}-01-01`, `${y}-12-31`]; }
      case "custom": return [filters.startDate || allDates[0], filters.endDate || latestDate];
      default: return null; // "all"
    }
  }, [filters.datePreset, filters.startDate, filters.endDate, latestDate, allDates]);

  const filteredData = useMemo(() => {
    return rawData.filter((r) => {
      if (dateRange && (r.date < dateRange[0] || r.date > dateRange[1])) return false;
      if (filters.operator && r.operator !== filters.operator) return false;
      if (filters.mcType && r.mcType !== filters.mcType) return false;
      if (filters.shift && r.shift !== filters.shift) return false;
      if (filters.jobNumber && String(r.jobNumber) !== filters.jobNumber) return false;
      if (filters.buyer && r.buyer !== filters.buyer) return false;
      if (filters.customer && r.customer !== filters.customer) return false;
      if (filters.machine && String(r.machine) !== filters.machine) return false;
      return true;
    });
  }, [rawData, dateRange, filters]);

  const resetFilters = () => setFilters({ datePreset: "all", startDate: "", endDate: "", operator: "", mcType: "", shift: "", jobNumber: "", buyer: "", customer: "", machine: "" });

  /* ---------- operator status classification ---------- */
  const operatorStatus = useCallback((usd) => {
    if (usd >= settings.belowTarget) return "Target Achieved";
    if (usd >= settings.belowTarget * (settings.nearTargetPct / 100)) return "Near Target";
    return "Below $400";
  }, [settings]);

  /* ---------- operator ranking (over current filtered scope) ---------- */
  const operatorRows = useMemo(() => {
    const byOp = groupBy(filteredData, (r) => r.operator);
    const days = new Set(filteredData.map((r) => r.date)).size || 1;
    const rows = [];
    byOp.forEach((records, operator) => {
      const agg = aggregate(records);
      const opDays = new Set(records.map((r) => r.date)).size || 1;
      const target = settings.belowTarget * opDays;
      const jobs = new Set(records.map((r) => r.jobNumber)).size;
      const machines = uniqSorted(records.map((r) => r.machine)).join(", ");
      rows.push({
        operator, pcs: agg.pcs, usd: agg.usd, target,
        achievement: target ? (agg.usd / target) * 100 : 0,
        avgUsdPerDay: agg.usd / opDays, jobs, machines, days: opDays,
        status: operatorStatus(agg.usd / opDays * (settings.belowTarget / settings.belowTarget)), // per-day basis
      });
    });
    rows.sort((a, b) => b.usd - a.usd);
    rows.forEach((r, i) => (r.rank = i + 1));
    return rows;
  }, [filteredData, settings, operatorStatus]);

  const belowTargetOps = operatorRows.filter((r) => r.status === "Below $400");
  const topOps = [...operatorRows].sort((a, b) => b.usd - a.usd).slice(0, 5);

  /* ---------- KPIs ---------- */
  const kpi = useMemo(() => {
    const agg = aggregate(filteredData);
    const days = new Set(filteredData.map((r) => r.date)).size || 1;
    const operatorDayPairs = new Set(filteredData.map((r) => r.operator + "|" + r.date)).size;
    const totalTarget = operatorDayPairs * settings.belowTarget;
    const operators = new Set(filteredData.map((r) => r.operator)).size;
    const jobs = new Set(filteredData.map((r) => r.jobNumber)).size;
    const machines = new Set(filteredData.map((r) => r.machine)).size;
    return {
      pcs: agg.pcs, usd: agg.usd, target: totalTarget,
      achievement: totalTarget ? (agg.usd / totalTarget) * 100 : 0,
      gap: agg.usd - totalTarget,
      operators, jobs, machines,
      avgUsdPerOp: operators ? agg.usd / operators : 0,
      avgPcsPerOp: operators ? agg.pcs / operators : 0,
      avgDhu: agg.avgDhu, wastage: agg.wastage, breakdown: agg.breakdown, days,
    };
  }, [filteredData, settings]);

  // Requirement #9: global Daily Production Target ($28,000 by default,
  // editable in Settings). Always reflects the most recent report date in
  // the database, independent of the other filters, so "today's" number
  // doesn't silently change when someone filters by operator/machine/etc.
  // Achievement is intentionally uncapped (can exceed 100%).
  const dailyTargetInfo = useMemo(() => {
    const todayRecords = rawData.filter((r) => r.date === latestDate);
    const actual = aggregate(todayRecords).usd;
    return {
      date: latestDate,
      target: settings.dailyTarget,
      actual,
      achievement: settings.dailyTarget ? (actual / settings.dailyTarget) * 100 : 0,
    };
  }, [rawData, latestDate, settings.dailyTarget]);

  /* ---------- grouped performance tables ---------- */
  function perfByKey(keyFn, labelKey) {
    const map = groupBy(filteredData, keyFn);
    const rows = [];
    map.forEach((records, key) => {
      const agg = aggregate(records);
      rows.push({
        [labelKey]: key,
        pcs: agg.pcs, usd: agg.usd,
        operators: new Set(records.map((r) => r.operator)).size,
        jobs: new Set(records.map((r) => r.jobNumber)).size,
        avgUsd: agg.usd / (records.length || 1),
        wastage: agg.wastage,
      });
    });
    return rows.sort((a, b) => b.usd - a.usd);
  }
  const machineRows = useMemo(() => perfByKey((r) => r.machine, "machine"), [filteredData]);
  const mcTypeRows = useMemo(() => perfByKey((r) => r.mcType, "mcType"), [filteredData]);
  const shiftRows = useMemo(() => perfByKey((r) => r.shift, "shift"), [filteredData]);
  const buyerRows = useMemo(() => perfByKey((r) => r.buyer, "buyer"), [filteredData]);
  const customerRows = useMemo(() => perfByKey((r) => r.customer, "customer"), [filteredData]);

  /* ---------- daily / monthly / yearly trend series ---------- */
  const dailySeries = useMemo(() => {
    const map = groupBy(filteredData, (r) => r.date);
    return Array.from(map.entries()).map(([date, recs]) => {
      const agg = aggregate(recs);
      const opDays = new Set(recs.map((r) => r.operator)).size;
      return { date, pcs: agg.pcs, usd: agg.usd, target: opDays * settings.belowTarget };
    }).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [filteredData, settings]);

  const monthlySeries = useMemo(() => {
    const map = groupBy(filteredData, (r) => monthKey(r.date));
    return Array.from(map.entries()).map(([month, recs]) => {
      const agg = aggregate(recs);
      const opDayPairs = new Set(recs.map((r) => r.operator + "|" + r.date)).size;
      return { month, pcs: agg.pcs, usd: agg.usd, target: opDayPairs * settings.belowTarget };
    }).sort((a, b) => (a.month > b.month ? 1 : -1));
  }, [filteredData, settings]);

  const yearlySeries = useMemo(() => {
    const map = groupBy(filteredData, (r) => yearKey(r.date));
    return Array.from(map.entries()).map(([year, recs]) => {
      const agg = aggregate(recs);
      const opDayPairs = new Set(recs.map((r) => r.operator + "|" + r.date)).size;
      return { year, pcs: agg.pcs, usd: agg.usd, target: opDayPairs * settings.belowTarget };
    }).sort((a, b) => (a.year > b.year ? 1 : -1));
  }, [filteredData, settings]);

  /* ---------- selected operator deep dive (independent of other filters, but respects date preset) ---------- */
  const operatorScoped = useMemo(() => {
    if (!selectedOperator) return null;
    const recs = rawData.filter((r) => r.operator === selectedOperator);
    const today = latestDate;
    const todayRecs = recs.filter((r) => r.date === today);
    const monthRecs = recs.filter((r) => monthKey(r.date) === monthKey(today));
    const yearRecs = recs.filter((r) => yearKey(r.date) === yearKey(today));
    const aT = aggregate(todayRecs), aM = aggregate(monthRecs), aY = aggregate(yearRecs);
    const monthDays = new Set(monthRecs.map((r) => r.date)).size || 1;
    const yearMonths = new Set(yearRecs.map((r) => monthKey(r.date))).size || 1;
    return {
      today: { ...aT, target: settings.belowTarget, achievement: aT.usd / settings.belowTarget * 100, jobs: new Set(todayRecs.map(r=>r.jobNumber)).size, machines: uniqSorted(todayRecs.map(r=>r.machine)).join(", "), shift: uniqSorted(todayRecs.map(r=>r.shift)).join(", ") },
      month: { ...aM, target: settings.belowTarget * monthDays, achievement: aM.usd / (settings.belowTarget * monthDays) * 100, days: monthDays, jobs: new Set(monthRecs.map(r=>r.jobNumber)).size, avgPcsDay: aM.pcs / monthDays, avgUsdDay: aM.usd / monthDays },
      year: { ...aY, target: settings.belowTarget * new Set(yearRecs.map(r=>r.date)).size, achievement: aY.usd / (settings.belowTarget * (new Set(yearRecs.map(r=>r.date)).size||1)) * 100, days: new Set(yearRecs.map(r=>r.date)).size, months: yearMonths, jobs: new Set(yearRecs.map(r=>r.jobNumber)).size, avgUsdMonth: aY.usd / yearMonths, avgPcsMonth: aY.pcs / yearMonths },
      trend: Array.from(groupBy(recs, (r) => r.date).entries()).map(([date, rs]) => { const a = aggregate(rs); return { date, pcs: a.pcs, usd: a.usd }; }).sort((a, b) => (a.date > b.date ? 1 : -1)),
      allRecords: [...recs].sort((a, b) => (a.date < b.date ? 1 : -1)),
    };
  }, [rawData, selectedOperator, latestDate, settings]);

  /* ---------- alerts ---------- */
  const alerts = useMemo(() => {
    const list = [];
    if (belowTargetOps.length) list.push({ sev: "critical", text: `${belowTargetOps.length} operator${belowTargetOps.length > 1 ? "s are" : " is"} below ${fmtUsd(settings.belowTarget)}` });
    if (kpi.achievement > 0 && kpi.achievement < 80) list.push({ sev: "warning", text: `Overall achievement is ${fmtPct(kpi.achievement)}, below 80% target` });
    if (kpi.breakdown > 0) list.push({ sev: "warning", text: `${fmtInt(kpi.breakdown)} machine breakdown hours recorded in current scope` });
    if (kpi.avgDhu != null && kpi.avgDhu > settings.dhuCrit) list.push({ sev: "critical", text: `Average DHU ${kpi.avgDhu.toFixed(2)}% exceeds critical threshold (${settings.dhuCrit}%)` });
    if (kpi.achievement >= 100) list.push({ sev: "good", text: "Production target achieved for the current scope" });
    if (topOps[0]) list.push({ sev: "good", text: `Top operator: ${topOps[0].operator} (${fmtUsd(topOps[0].usd)})` });
    if (!list.length) list.push({ sev: "good", text: "No alerts — all metrics within normal range" });
    return list;
  }, [belowTargetOps, kpi, settings, topOps]);

  /* ---------- job search ---------- */
  const [jobQuery, setJobQuery] = useState("");
  const jobResults = useMemo(() => {
    if (!jobQuery.trim()) return [];
    return rawData.filter((r) => String(r.jobNumber).includes(jobQuery.trim()));
  }, [rawData, jobQuery]);

  /* ---------- import handling ---------- */
  const REQUIRED_COLS = ["date", "mcType", "shift", "jobNumber", "pcs", "usd", "operator", "machine"];
  function normalizeRow(raw) {
    const get = (...keys) => { for (const k of keys) { if (raw[k] !== undefined) return raw[k]; } return undefined; };
    // Strips thousands separators / currency symbols before Number() conversion
    // so values like "125,500" or "$1,250.00" don't parse as NaN.
    const toNum = (v) => {
      if (v === undefined || v === null || v === "") return null;
      if (typeof v === "number") return v;
      const cleaned = String(v).replace(/[,$\s]/g, "");
      return cleaned === "" ? null : Number(cleaned);
    };
    return {
      // Single date parser for every input shape (DD/MM/YYYY text, ISO text,
      // Excel serial, or a true Date object) — see src/lib/dateUtils.js.
      // Always resolves to "YYYY-MM-DD" or null (caught by validation below).
      date: parseReportDate(get("Date", "date", "report_date")),
      mcType: get("MC Type", "mcType"),
      shift: get("Shift", "shift"),
      jobNumber: get("Job Number", "JOB Number", "jobNumber"),
      unitPrice: toNum(get("Unit Price", "Unit Price $", "unitPrice")) || 0,
      pcs: toNum(get("Production PCS", "Production (Pcs)", "pcs")) || 0,
      usd: toNum(get("Production Dollar (USD)", "Production Dollar $USD", "usd")) || 0,
      priceDz: toNum(get("Price/DZ", "Prices/dz", "priceDz")) || 0,
      buyer: get("Buyer Name", "buyer"),
      customer: get("Customer Name", "customer"),
      operator: get("Operator Name", "Oparetor Name", "operator"),
      machine: get("Machine No", "machine"),
      target: toNum(get("Target USD", "target")),
      dhu: toNum(get("DHU %", "dhu")),
      wastage: toNum(get("Wastage", "wastage")) || 0,
      breakdown: toNum(get("Machine Breakdown", "Mchine Breakdown", "breakdown")) || 0,
      remarks: get("Remarks", "remarks") || "",
    };
  }

  // Step 1: parse + validate only. Nothing is saved yet — this just builds
  // the preview the user reviews before clicking "Submit to Database".
  function processImportedRows(objs) {
    let invalid = 0, withinBatchDupes = 0, emptyOperator = 0, invalidDate = 0;
    const seen = new Set();
    const clean = [];
    for (const o of objs) {
      const row = normalizeRow(o);
      if (!row.operator) { emptyOperator++; invalid++; continue; }
      if (!row.date) { invalidDate++; invalid++; continue; } // row.date is a validated "YYYY-MM-DD" string or null
      if (isNaN(row.pcs) || isNaN(row.usd)) { invalid++; continue; }
      const sig = `${row.date}|${row.operator}|${row.jobNumber}|${row.machine}|${row.shift}`;
      clean.push(row);
    }
    setPreviewRows(clean);
    setImportSummary({
      stage: "preview",
      total: objs.length, valid: clean.length, invalid, withinBatchDupes, emptyOperator, invalidDate,
    });
  }

  // Step 2: user clicks "Submit to Database" — this is the only place that
  // actually writes to Supabase. Uses upsert + the DB's unique index
  // (report_date, job_number, machine_no, operator_name, shift) with
  // ignoreDuplicates so cross-submission duplicates are rejected server-side
  // rather than silently duplicated, per requirement #6.
  async function submitPreviewToDatabase() {
    if (!previewRows || !previewRows.length) return;

    if (!supabaseReady) {
      // Local demo mode (no Supabase configured): behave like the original
      // React-state-only version, but still be explicit that it's not persisted.
      setRawData((prev) => [...prev, ...previewRows]);
      setImportSummary({ stage: "done", total: previewRows.length, valid: previewRows.length, dupes: 0, warning: "Supabase is not configured — this data lives only in this browser tab and will be lost on refresh." });
      setPreviewRows(null);
      resetFilters(); setSelectedOperator("");
      return;
    }

    setSubmitting(true);
    const payload = previewRows.map((r) => recordToDbRow(r, session?.user?.id));
    const { data, error } = await supabase
      .from("production_data")
      .insert(payload)
      .select();
    setSubmitting(false);

    if (error) {
      setImportSummary({ stage: "error", error: `Database insert failed: ${error.message}` });
      return;
    }

    const inserted = data.length;
    const dupesSkipped = payload.length - inserted;
    const reportDates = uniqSorted(previewRows.map((r) => r.date));
    const label = reportDates.length === 1 ? `${formatDisplayDate(reportDates[0])} report` : `${reportDates.length} dates`;

    setImportSummary({
      stage: "done",
      total: payload.length,
      valid: inserted,
      dupes: dupesSkipped,
      message: dupesSkipped > 0 && inserted === 0
        ? "Duplicate data detected. Existing data was not duplicated."
        : `${label} successfully saved to database.`,
    });
    setPreviewRows(null);
    await fetchFromDatabase(); // refresh dashboard from the database (source of truth)
    resetFilters(); setSelectedOperator("");
  }

  function cancelPreview() { setPreviewRows(null); setImportSummary(null); }

  // RFC4180-style CSV line parser: handles quoted fields, embedded commas
  // (e.g. "125,500"), and escaped double-quotes ("" inside a quoted field).
  function parseCsvLine(line) {
    const cells = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else { inQuotes = false; }
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = /\.csv$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (isCsv) {
          const text = ev.target.result;
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
          const headers = parseCsvLine(lines[0]);
          const objs = lines.slice(1).map((line) => {
            const cells = parseCsvLine(line);
            const o = {};
            headers.forEach((h, i) => (o[h] = cells[i]));
            return o;
          });
          processImportedRows(objs);
        } else {
          const wb = XLSX.read(ev.target.result, { type: "array", cellDates: false, cellNF: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const objs = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
          processImportedRows(objs);
        }
      } catch (err) {
        setImportSummary({ error: String(err.message || err) });
      }
    };
    if (isCsv) reader.readAsText(file); else reader.readAsArrayBuffer(file);
  }

  /* ============================== RENDER ============================== */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      {/* Sidebar */}
      <aside className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${navOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="text-lg font-bold text-slate-900 leading-tight">PFL Production</div>
          <div className="text-xs text-slate-400">Operator Performance Dashboard</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.filter((n) => !n.permission || can(profile, n.permission)).map((n) => {
            const Icon = n.icon;
            const active = page === n.key;
            return (
              <button key={n.key} onClick={() => { setPage(n.key); setNavOpen(false); }}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm text-left transition-colors duration-150 ${active ? "!bg-blue-600 !text-white font-bold border-r-4 border-blue-300 shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
                <Icon size={16} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-slate-200 text-[11px] text-slate-400">
          Data as of {fmtDate(latestDate)} · {rawData.length.toLocaleString()} records
          {dataLoading && <span className="text-blue-500"> · loading…</span>}
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded border border-slate-200" onClick={() => setNavOpen(true)}>
              <LayoutGrid size={16} />
            </button>
            <h1 className="text-sm font-semibold text-slate-700">{NAV.find((n) => n.key === page)?.label}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={13} className="text-blue-500" /> {profile?.email || "Local demo"} <span className="text-slate-300">·</span> <span className="capitalize font-medium">{profile?.role || "no role"}</span>
            </div>
            {onLogout && (
              <button onClick={onLogout} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                <LogOut size={13} /> Logout
              </button>
            )}
          </div>
        </header>
        {dataError && (
          <div className="bg-rose-50 text-rose-700 text-xs px-4 lg:px-6 py-2 border-b border-rose-200 flex items-center gap-2">
            <AlertTriangle size={13} /> {dataError}
          </div>
        )}

        {/* Global filter bar */}
        <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date</label>
            <select value={filters.datePreset} onChange={(e) => setFilters((f) => ({ ...f, datePreset: e.target.value }))}
              className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {filters.datePreset === "custom" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">From</label>
                <input type="date" value={filters.startDate} onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">To</label>
                <input type="date" value={filters.endDate} onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
              </div>
            </>
          )}
          <FilterSelect label="Operator" value={filters.operator} onChange={(v) => setFilters((f) => ({ ...f, operator: v }))} options={options.operators} />
          <FilterSelect label="MC Type" value={filters.mcType} onChange={(v) => setFilters((f) => ({ ...f, mcType: v }))} options={options.mcTypes} />
          <FilterSelect label="Shift" value={filters.shift} onChange={(v) => setFilters((f) => ({ ...f, shift: v }))} options={options.shifts} />
          <FilterSelect label="Buyer" value={filters.buyer} onChange={(v) => setFilters((f) => ({ ...f, buyer: v }))} options={options.buyers} />
          <FilterSelect label="Customer" value={filters.customer} onChange={(v) => setFilters((f) => ({ ...f, customer: v }))} options={options.customers} />
          <FilterSelect label="Machine" value={filters.machine} onChange={(v) => setFilters((f) => ({ ...f, machine: v }))} options={options.machines} />
          <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <RotateCcw size={13} /> Reset Filters
          </button>
          <span className="text-xs text-slate-400 ml-auto">{filteredData.length.toLocaleString()} of {rawData.length.toLocaleString()} records match</span>
        </div>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {page === "overview" && (
            <OverviewPage kpi={kpi} settings={settings} alerts={alerts} operatorRows={operatorRows} belowTargetOps={belowTargetOps} topOps={topOps} dailySeries={dailySeries} mcTypeRows={mcTypeRows} dailyTargetInfo={dailyTargetInfo} />
          )}
          {page === "daily" && (
            <DailyPage dailySeries={dailySeries} monthlySeries={monthlySeries} yearlySeries={yearlySeries} operatorRows={operatorRows} settings={settings} />
          )}
          {page === "dailyplan" && (
            <DailyPlanPage dailyPlans={dailyPlans} latestDate={latestDate} allDates={allDates}
              onSubmit={submitDailyPlan} loading={planLoading} saving={planSaving}
              error={planError} savedMsg={planSavedMsg} canEdit={can(profile, "import_data")}
              currency={settings.currency} />
          )}
          {page === "ot" && <OTPage documents={otDocuments} onSave={saveOtDocument} onDelete={deleteOtDocument} />}
          {page === "operators" && (
            <OperatorsPage operatorRows={operatorRows} settings={settings} options={options}
              selectedOperator={selectedOperator} setSelectedOperator={setSelectedOperator}
              operatorScoped={operatorScoped} latestDate={latestDate} />
          )}
          {page === "machines" && <BreakdownPage title="Machine" rows={machineRows} labelKey="machine" />}
          {page === "mctype" && <BreakdownPage title="MC Type" rows={mcTypeRows} labelKey="mcType" />}
          {page === "shift" && <BreakdownPage title="Shift" rows={shiftRows} labelKey="shift" />}
          {page === "buyers" && <BreakdownPage title="Buyer" rows={buyerRows} labelKey="buyer" />}
          {page === "customers" && <BreakdownPage title="Customer" rows={customerRows} labelKey="customer" />}
          {page === "jobs" && <JobsPage jobQuery={jobQuery} setJobQuery={setJobQuery} jobResults={jobResults} settings={settings} />}
          {page === "wastage" && <WastagePage filteredData={filteredData} kpi={kpi} settings={settings} />}
          {page === "table" && <TablePage filteredData={filteredData} />}
          {page === "import" && can(profile, "import_data") && (
            <ImportPage handleFile={handleFile} importSummary={importSummary} fileInputRef={fileInputRef}
              rawData={rawData} previewRows={previewRows} onSubmit={submitPreviewToDatabase}
              onCancel={cancelPreview} submitting={submitting} />
          )}
          {page === "users" && can(profile, "manage_users") && <UserManagement />}
          {page === "settings" && <SettingsPage settings={settings} setSettings={setSettings} canEdit={can(profile, "edit_data")} />}
        </main>
      </div>
    </div>
  );
}

/* ============================== PAGE: OVERVIEW ============================== */
function OverviewPage({ kpi, settings, alerts, operatorRows, belowTargetOps, topOps, dailySeries, mcTypeRows, dailyTargetInfo }) {
  return (
    <div className="flex flex-col gap-5">
      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <SectionTitle right={<span className="text-xs text-slate-400">{fmtDate(dailyTargetInfo.date)}</span>}>
          Daily Production Target
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Daily Target</div>
            <div className="text-2xl font-bold text-slate-900">{fmtUsd(dailyTargetInfo.target, settings.currency)}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Actual Production</div>
            <div className="text-2xl font-bold text-blue-600">{fmtUsd(dailyTargetInfo.actual, settings.currency)}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Achievement</div>
            <div className={`text-2xl font-bold ${dailyTargetInfo.achievement >= 100 ? "text-emerald-600" : "text-amber-600"}`}>{fmtPct(dailyTargetInfo.achievement)}</div>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-4">
          <div className={`h-full ${dailyTargetInfo.achievement >= 100 ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(100, Math.max(0, dailyTargetInfo.achievement))}%` }} />
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total PCS" value={fmtInt(kpi.pcs)} icon={TrendingUp} />
        <KpiCard label="Total USD" value={fmtUsd(kpi.usd, settings.currency)} icon={TrendingUp} />
        <KpiCard label="Target USD" value={fmtUsd(kpi.target, settings.currency)} sub={`@ ${fmtUsd(settings.belowTarget)}/operator/day`} />
        <KpiCard label="Achievement %" value={fmtPct(kpi.achievement)} tone={kpi.achievement >= 100 ? "good" : kpi.achievement < 80 ? "bad" : "warn"} />
        <KpiCard label="Operators" value={fmtInt(kpi.operators)} icon={Users} />
        <KpiCard label="Jobs" value={fmtInt(kpi.jobs)} />
        <KpiCard label="Machines" value={fmtInt(kpi.machines)} />
        <KpiCard label="Avg USD / Operator" value={fmtUsd(kpi.avgUsdPerOp)} />
        <KpiCard label="Avg PCS / Operator" value={fmtInt(kpi.avgPcsPerOp)} />
        <KpiCard label="Avg DHU %" value={kpi.avgDhu != null ? fmtPct(kpi.avgDhu) : "N/A"} />
        <KpiCard label="Total Wastage" value={fmtInt(kpi.wastage)} />
        <KpiCard label="Breakdown Hours" value={fmtInt(kpi.breakdown)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <SectionTitle>Management Alerts</SectionTitle>
          <div className="flex flex-col gap-2">
            {alerts.map((a, i) => (
              <div key={i} className={`flex items-center gap-2.5 text-sm rounded-lg px-3 py-2 border ${a.sev === "critical" ? "bg-rose-50 text-rose-700 border-rose-200" : a.sev === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                {a.sev === "good" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                {a.text}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle>Top Operator vs Lowest</SectionTitle>
          {operatorRows.length ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Best Operator</span><span className="font-semibold">{operatorRows[0].operator} · {fmtUsd(operatorRows[0].usd)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Lowest Operator</span><span className="font-semibold">{operatorRows[operatorRows.length - 1].operator} · {fmtUsd(operatorRows[operatorRows.length - 1].usd)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Best Machine</span><span className="font-semibold">{mcTypeRows[0]?.mcType ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Below Target Count</span><span className="font-semibold text-rose-600">{belowTargetOps.length}</span></div>
            </div>
          ) : <EmptyState text="No data in current scope" />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Daily USD Trend">
          {dailySeries.length ? (
            <LineChart data={dailySeries}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtUsd(v)} labelFormatter={fmtDate} />
              <Line type="monotone" dataKey="usd" name="Actual USD" stroke={COLORS[0]} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="target" name="Target USD" stroke={COLORS[4]} strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
        <ChartCard title="Production USD by MC Type">
          {mcTypeRows.length ? (
            <BarChart data={mcTypeRows}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="mcType" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtUsd(v)} />
              <Bar dataKey="usd" name="USD" radius={[4, 4, 0, 0]}>
                {mcTypeRows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
      </div>

      <Card>
        <SectionTitle right={<span className="text-xs text-rose-600 font-medium">{belowTargetOps.length} flagged</span>}>Operators Below {fmtUsd(settings.belowTarget)}</SectionTitle>
        {belowTargetOps.length ? (
          <DataTable pageSize={5} columns={[
            { key: "operator", label: "Operator" },
            { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
            { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
            { key: "target", label: "Target", render: (r) => fmtUsd(r.target) },
            { key: "achievement", label: "Achv %", render: (r) => fmtPct(r.achievement) },
            { key: "days", label: "Days" },
            { key: "jobs", label: "Jobs" },
            { key: "machines", label: "Machine" },
          ]} rows={belowTargetOps} initialSort={{ key: "usd", dir: "asc" }} />
        ) : <EmptyState text="No operators below threshold — great work!" />}
      </Card>
    </div>
  );
}

/* ============================== PAGE: DAILY/MONTHLY/YEARLY ============================== */
function DailyPage({ dailySeries, monthlySeries, yearlySeries, operatorRows, settings }) {
  const [tab, setTab] = useState("daily");
  const series = tab === "daily" ? dailySeries : tab === "monthly" ? monthlySeries : yearlySeries;
  const xKey = tab === "daily" ? "date" : tab === "monthly" ? "month" : "year";
  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        {["daily", "monthly", "yearly"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`text-sm px-4 py-1.5 rounded-full border font-medium capitalize ${tab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label={`Total PCS (${tab})`} value={fmtInt(series.reduce((s, r) => s + r.pcs, 0))} />
        <KpiCard label={`Total USD (${tab})`} value={fmtUsd(series.reduce((s, r) => s + r.usd, 0))} />
        <KpiCard label={`Target USD (${tab})`} value={fmtUsd(series.reduce((s, r) => s + r.target, 0))} />
        <KpiCard label="Achievement %" value={fmtPct(series.reduce((s, r) => s + r.usd, 0) / (series.reduce((s, r) => s + r.target, 0) || 1) * 100)} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`${tab[0].toUpperCase() + tab.slice(1)} PCS Trend`}>
          {series.length ? (
            <AreaChart data={series}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtInt(v)} />
              <Area type="monotone" dataKey="pcs" stroke={COLORS[1]} fill={COLORS[1]} fillOpacity={0.15} />
            </AreaChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
        <ChartCard title={`${tab[0].toUpperCase() + tab.slice(1)} Target vs Actual`}>
          {series.length ? (
            <BarChart data={series}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtUsd(v)} />
              <Legend />
              <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="usd" name="Actual" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
      </div>
      <Card>
        <SectionTitle>Operator Ranking ({tab} scope filters applied globally)</SectionTitle>
        <DataTable pageSize={8} columns={[
          { key: "rank", label: "#" }, { key: "operator", label: "Operator" },
          { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
          { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
          { key: "achievement", label: "Achv %", render: (r) => fmtPct(r.achievement) },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]} rows={operatorRows} initialSort={{ key: "rank", dir: "asc" }} />
      </Card>
    </div>
  );
}

/* ============================== PAGE: DAILY PLAN ============================== */
function DailyPlanPage({ dailyPlans, latestDate, allDates, onSubmit, loading, saving, error, savedMsg, canEdit, currency }) {
  // Daily Plan always opens on TODAY (Bangladesh time), not the latest uploaded production date.
  // Production data may be uploaded only through yesterday (e.g. 06-Sep), while today's plan is for today (e.g. 07-Sep).
  const [planDate, setPlanDate] = useState(() => todayDhakaISO());

  const plansForDate = useMemo(
    () => dailyPlans.filter((p) => p.plan_date === planDate),
    [dailyPlans, planDate]
  );
  const existing = useMemo(() => {
    const m = {};
    plansForDate.forEach((p) => { m[p.supervisor_name] = p.planned_usd; });
    return m;
  }, [plansForDate]);

  const [values, setValues] = useState({});
  useEffect(() => {
    const next = {};
    SUPERVISORS.forEach((name) => { next[name] = existing[name] ?? ""; });
    setValues(next);
  }, [planDate, dailyPlans]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveTotal = SUPERVISORS.reduce((s, name) => s + (Number(values[name]) || 0), 0);
  const savedTotal = plansForDate.reduce((s, p) => s + (Number(p.planned_usd) || 0), 0);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Card>
        <SectionTitle>Daily Plan</SectionTitle>
        <p className="text-sm text-slate-500 mb-4">Each supervisor's planned USD for the day. Submitted plans are saved date-wise in Supabase and summed automatically into the Daily Plan Total below.</p>

        <div className="flex flex-col gap-1 mb-4 max-w-xs">
          <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Date</label>
          <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg px-3 py-2" />
        </div>

        {!canEdit && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            You have read-only access — only Admin or Manager accounts can submit a Daily Plan.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {SUPERVISORS.map((name) => (
            <div key={name} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
              <span className="text-sm text-slate-700">{name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">$</span>
                <input type="number" min="0" step="1" disabled={!canEdit || !planDate}
                  value={values[name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                  placeholder="0"
                  className="w-32 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right disabled:bg-slate-50 disabled:text-slate-400" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Daily Plan Total</span>
          <span className="text-xl font-bold text-blue-600">{fmtUsd(liveTotal, currency)}</span>
        </div>

        {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-3">{error}</div>}
        {savedMsg && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mt-3">{savedMsg}</div>}

        {canEdit && (
          <button onClick={() => onSubmit(planDate, values)} disabled={saving || !planDate}
            className="mt-4 w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? "Saving..." : "Save Daily Plan"}
          </button>
        )}
      </Card>

      <Card>
        <SectionTitle>Submitted Plans — {fmtDate(planDate)}</SectionTitle>
        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : plansForDate.length ? (
          <>
            <DataTable pageSize={5} columns={[
              { key: "supervisor_name", label: "Supervisor" },
              { key: "planned_usd", label: "Planned USD", render: (r) => fmtUsd(r.planned_usd, currency) },
            ]} rows={plansForDate} initialSort={{ key: "supervisor_name", dir: "asc" }} />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Total (saved)</span>
              <span className="text-lg font-bold text-slate-900">{fmtUsd(savedTotal, currency)}</span>
            </div>
          </>
        ) : <EmptyState text="No plan submitted for this date yet" />}
      </Card>
    </div>
  );
}

/* ============================== PAGE: OPERATORS ============================== */
function OperatorsPage({ operatorRows, settings, options, selectedOperator, setSelectedOperator, operatorScoped, latestDate }) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>Select Operator</SectionTitle>
        <select value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}
          className="w-full max-w-md text-base border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium">
          <option value="">— Choose an operator —</option>
          {options.operators.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Card>

      {selectedOperator && operatorScoped && (
        <>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">{selectedOperator}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OperatorPeriodBlock title={`Today (${fmtDate(latestDate)})`} data={operatorScoped.today} extra={[
                ["Jobs", operatorScoped.today.jobs], ["Machine", operatorScoped.today.machines || "—"], ["Shift", operatorScoped.today.shift || "—"],
              ]} />
              <OperatorPeriodBlock title="This Month" data={operatorScoped.month} extra={[
                ["Production Days", operatorScoped.month.days], ["Jobs", operatorScoped.month.jobs],
                ["Avg PCS/Day", fmtInt(operatorScoped.month.avgPcsDay)], ["Avg USD/Day", fmtUsd(operatorScoped.month.avgUsdDay)],
              ]} />
              <OperatorPeriodBlock title="This Year" data={operatorScoped.year} extra={[
                ["Production Days", operatorScoped.year.days], ["Jobs", operatorScoped.year.jobs],
                ["Avg Monthly PCS", fmtInt(operatorScoped.year.avgPcsMonth)], ["Avg Monthly USD", fmtUsd(operatorScoped.year.avgUsdMonth)],
              ]} />
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Operator USD Trend">
              {operatorScoped.trend.length ? (
                <LineChart data={operatorScoped.trend}>
                  <CartesianGrid stroke={LINE} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtUsd(v)} labelFormatter={fmtDate} />
                  <Line type="monotone" dataKey="usd" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : <EmptyState text="No history" />}
            </ChartCard>
            <ChartCard title="Operator PCS Trend">
              {operatorScoped.trend.length ? (
                <LineChart data={operatorScoped.trend}>
                  <CartesianGrid stroke={LINE} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmtInt(v)} labelFormatter={fmtDate} />
                  <Line type="monotone" dataKey="pcs" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : <EmptyState text="No history" />}
            </ChartCard>
          </div>

          <Card>
            <SectionTitle>Daily Production Records — {selectedOperator}</SectionTitle>
            <DataTable pageSize={10} columns={[
              { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
              { key: "shift", label: "Shift" }, { key: "jobNumber", label: "Job No" },
              { key: "mcType", label: "MC Type" }, { key: "machine", label: "Machine" },
              { key: "buyer", label: "Buyer" }, { key: "customer", label: "Customer" },
              { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
              { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
            ]} rows={operatorScoped.allRecords} initialSort={{ key: "date", dir: "desc" }} />
          </Card>
        </>
      )}

      <Card>
        <SectionTitle right={<button onClick={() => downloadCsv("operator_ranking.csv", operatorRows, [
          { key: "rank", label: "Rank" }, { key: "operator", label: "Operator" }, { key: "pcs", label: "PCS" },
          { key: "usd", label: "USD" }, { key: "target", label: "Target" }, { key: "achievement", label: "Achievement %" }, { key: "status", label: "Status" },
        ])} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"><Download size={13} /> Export CSV</button>}>
          Operator Ranking (current filter scope)
        </SectionTitle>
        <DataTable pageSize={10} columns={[
          { key: "rank", label: "Rank" }, { key: "operator", label: "Operator" },
          { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
          { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
          { key: "target", label: "Target", render: (r) => fmtUsd(r.target) },
          { key: "achievement", label: "Achv %", render: (r) => fmtPct(r.achievement) },
          { key: "avgUsdPerDay", label: "Avg USD/Day", render: (r) => fmtUsd(r.avgUsdPerDay) },
          { key: "jobs", label: "Jobs" }, { key: "machines", label: "Machine" },
          { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]} rows={operatorRows} initialSort={{ key: "rank", dir: "asc" }} />
      </Card>
    </div>
  );
}

function OperatorPeriodBlock({ title, data, extra }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</div>
      <div className="text-2xl font-bold text-slate-900">{fmtInt(data.pcs)} <span className="text-sm font-normal text-slate-400">PCS</span></div>
      <div className="text-xl font-bold text-blue-600 mb-2">{fmtUsd(data.usd)}</div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span>Target {fmtUsd(data.target)}</span>
        <StatusBadge status={data.achievement >= 100 ? "Target Achieved" : data.achievement >= 90 ? "Near Target" : "Below $400"} />
      </div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(0, data.achievement))}%` }} />
      </div>
      {extra.map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs text-slate-500 py-0.5">
          <span>{k}</span><span className="font-medium text-slate-700">{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================== PAGE: GENERIC BREAKDOWN (Machine/MCType/Shift/Buyer/Customer) ============================== */
function BreakdownPage({ title, rows, labelKey }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`${title}-wise Production PCS`}>
          {rows.length ? (
            <BarChart data={rows}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtInt(v)} />
              <Bar dataKey="pcs" radius={[4, 4, 0, 0]}>{rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
        <ChartCard title={`${title}-wise Production USD`}>
          {rows.length ? (
            <BarChart data={rows}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey={labelKey} tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmtUsd(v)} />
              <Bar dataKey="usd" radius={[4, 4, 0, 0]}>{rows.map((_, i) => <Cell key={i} fill={COLORS[(i + 3) % COLORS.length]} />)}</Bar>
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
      </div>
      <Card>
        <SectionTitle>{title} Performance</SectionTitle>
        <DataTable pageSize={10} columns={[
          { key: labelKey, label: title },
          { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
          { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
          { key: "operators", label: "Operators" },
          { key: "jobs", label: "Jobs" },
          { key: "avgUsd", label: "Avg USD/Record", render: (r) => fmtUsd(r.avgUsd) },
          { key: "wastage", label: "Wastage", render: (r) => fmtInt(r.wastage) },
        ]} rows={rows} initialSort={{ key: "usd", dir: "desc" }} />
      </Card>
    </div>
  );
}

/* ============================== PAGE: JOBS ============================== */
function JobsPage({ jobQuery, setJobQuery, jobResults, settings }) {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <SectionTitle>Job Number Search</SectionTitle>
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
          <input value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} placeholder="Enter Job Number..."
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300" />
        </div>
      </Card>
      {jobQuery.trim() && (
        <Card>
          <SectionTitle>{jobResults.length} matching record{jobResults.length !== 1 ? "s" : ""}</SectionTitle>
          {jobResults.length ? (
            <DataTable pageSize={10} columns={[
              { key: "jobNumber", label: "Job No" }, { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
              { key: "buyer", label: "Buyer" }, { key: "customer", label: "Customer" },
              { key: "mcType", label: "MC Type" }, { key: "machine", label: "Machine" },
              { key: "operator", label: "Operator" }, { key: "shift", label: "Shift" },
              { key: "unitPrice", label: "Unit Price", render: (r) => "$" + Number(r.unitPrice).toFixed(4) },
              { key: "priceDz", label: "Price/DZ", render: (r) => "$" + Number(r.priceDz || 0).toFixed(4) },
              { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
              { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
            ]} rows={jobResults} initialSort={{ key: "date", dir: "desc" }} />
          ) : <EmptyState text="No job matches that number" />}
        </Card>
      )}
    </div>
  );
}

/* ============================== PAGE: WASTAGE / BREAKDOWN / DHU ============================== */
function WastagePage({ filteredData, kpi, settings }) {
  const byOperator = useMemo(() => {
    const map = groupBy(filteredData, (r) => r.operator);
    return Array.from(map.entries()).map(([operator, recs]) => ({
      operator, wastage: recs.reduce((s, r) => s + (r.wastage || 0), 0), breakdown: recs.reduce((s, r) => s + (r.breakdown || 0), 0),
    })).sort((a, b) => b.wastage - a.wastage);
  }, [filteredData]);
  const byMachine = useMemo(() => {
    const map = groupBy(filteredData, (r) => r.machine);
    return Array.from(map.entries()).map(([machine, recs]) => ({
      machine, wastage: recs.reduce((s, r) => s + (r.wastage || 0), 0), breakdown: recs.reduce((s, r) => s + (r.breakdown || 0), 0),
    })).sort((a, b) => b.breakdown - a.breakdown || b.wastage - a.wastage);
  }, [filteredData]);
  const hasDhu = filteredData.some((r) => r.dhu != null);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Wastage" value={fmtInt(kpi.wastage)} />
        <KpiCard label="Avg Wastage / Record" value={fmtInt(kpi.wastage / (filteredData.length || 1))} />
        <KpiCard label="Total Breakdown Hours" value={fmtInt(kpi.breakdown)} />
        <KpiCard label="Avg DHU %" value={hasDhu ? fmtPct(kpi.avgDhu) : "N/A — not in dataset"} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Wastage by Operator (Top 10)">
          {byOperator.length ? (
            <BarChart data={byOperator.slice(0, 10)}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="operator" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={70} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="wastage" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
        <ChartCard title="Breakdown Hours by Machine">
          {byMachine.length ? (
            <BarChart data={byMachine}>
              <CartesianGrid stroke={LINE} vertical={false} />
              <XAxis dataKey="machine" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="breakdown" fill={COLORS[5]} radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : <EmptyState text="No data" />}
        </ChartCard>
      </div>
      {!hasDhu && (
        <Card className="text-sm text-slate-500 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-500" /> DHU % is not present in the current dataset. It's an optional column — once imported data includes a "DHU %" field, this page will automatically compute averages, rankings and trends using the thresholds set in Settings ({settings.dhuWarn}% warning / {settings.dhuCrit}% critical).
        </Card>
      )}
      <Card>
        <SectionTitle>Wastage & Breakdown by Operator</SectionTitle>
        <DataTable pageSize={10} columns={[
          { key: "operator", label: "Operator" },
          { key: "wastage", label: "Wastage", render: (r) => fmtInt(r.wastage) },
          { key: "breakdown", label: "Breakdown Hrs", render: (r) => fmtInt(r.breakdown) },
        ]} rows={byOperator} initialSort={{ key: "wastage", dir: "desc" }} />
      </Card>
    </div>
  );
}

/* ============================== PAGE: DATA TABLE ============================== */
function TablePage({ filteredData }) {
  const columns = [
    { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
    { key: "mcType", label: "MC Type" }, { key: "shift", label: "Shift" }, { key: "jobNumber", label: "Job No" },
    { key: "unitPrice", label: "Unit Price", render: (r) => "$" + Number(r.unitPrice || 0).toFixed(4) },
    { key: "pcs", label: "PCS", render: (r) => fmtInt(r.pcs) },
    { key: "usd", label: "USD", render: (r) => fmtUsd(r.usd) },
    { key: "priceDz", label: "Price/DZ", render: (r) => "$" + Number(r.priceDz || 0).toFixed(4) },
    { key: "buyer", label: "Buyer" }, { key: "customer", label: "Customer" }, { key: "operator", label: "Operator" },
    { key: "machine", label: "Machine" }, { key: "wastage", label: "Wastage", render: (r) => fmtInt(r.wastage) },
    { key: "breakdown", label: "Breakdown", render: (r) => fmtInt(r.breakdown) },
    { key: "remarks", label: "Remarks" },
  ];
  return (
    <Card>
      <SectionTitle right={
        <div className="flex gap-2">
          <button onClick={() => downloadCsv("pfl_production_data.csv", filteredData, columns)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            <Download size={13} /> Export CSV
          </button>
        </div>
      }>Production Data Table</SectionTitle>
      <DataTable pageSize={15} columns={columns} rows={filteredData} initialSort={{ key: "date", dir: "desc" }} />
    </Card>
  );
}

/* ============================== PAGE: IMPORT ============================== */
function ImportPage({ handleFile, importSummary, fileInputRef, rawData, previewRows, onSubmit, onCancel, submitting }) {
  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {!supabaseReady && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>Supabase is not configured — imports in this mode only update the current browser tab and are lost on refresh. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY to persist data.</span>
        </div>
      )}

      <Card>
        <SectionTitle>Import Daily Report</SectionTitle>
        <p className="text-sm text-slate-500 mb-4">Accepts CSV or Excel (.xlsx) files. Expected columns: Date, MC Type, Shift, Job Number, Unit Price, Production PCS, Production Dollar (USD), Price/DZ, Buyer Name, Customer Name, Operator Name, Machine No. Target USD, DHU %, Wastage, Machine Breakdown and Remarks are optional. Dates may be DD/MM/YYYY, YYYY-MM-DD, or a native Excel date column.</p>
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-10 cursor-pointer hover:bg-slate-50 transition">
          <Upload size={28} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Click to select a CSV or XLSX file</span>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFile} />
        </label>
      </Card>

      {previewRows && previewRows.length > 0 && (
        <Card>
          <SectionTitle right={
            <div className="flex gap-2">
              <button onClick={onCancel} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={onSubmit} disabled={submitting}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {submitting ? "Saving..." : `Submit ${previewRows.length.toLocaleString()} Records to Database`}
              </button>
            </div>
          }>Preview — review before saving</SectionTitle>
          <DataTable pageSize={8} columns={[
            { key: "date", label: "Date", render: (r) => formatDisplayDate(r.date) },
            { key: "operator", label: "Operator" }, { key: "jobNumber", label: "Job No" },
            { key: "mcType", label: "MC Type" }, { key: "shift", label: "Shift" }, { key: "machine", label: "Machine" },
            { key: "pcs", label: "PCS", render: (r) => Math.round(r.pcs).toLocaleString() },
            { key: "usd", label: "USD", render: (r) => "$" + Number(r.usd).toFixed(2) },
          ]} rows={previewRows} initialSort={{ key: "date", dir: "asc" }} />
        </Card>
      )}

      {importSummary && (
        <Card>
          <SectionTitle>Import Summary</SectionTitle>
          {importSummary.stage === "error" ? (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{importSummary.error}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Records Found</span><span className="font-semibold">{importSummary.total.toLocaleString()}</span></div>
                <div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Valid Records</span><span className="font-semibold text-emerald-600">{importSummary.valid.toLocaleString()}</span></div>
                {importSummary.invalid !== undefined && (
                  <div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Invalid Records</span><span className="font-semibold text-rose-600">{importSummary.invalid.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Duplicates Skipped</span><span className="font-semibold text-amber-600">{(importSummary.dupes ?? importSummary.withinBatchDupes ?? 0).toLocaleString()}</span></div>
                {importSummary.emptyOperator !== undefined && (
                  <div className="flex justify-between border-b border-slate-100 py-1.5 col-span-2"><span className="text-slate-500">Empty Operator Names</span><span className="font-semibold">{importSummary.emptyOperator.toLocaleString()}</span></div>
                )}
              </div>
              {importSummary.message && (
                <div className={`text-sm rounded-lg px-3 py-2 mt-3 border ${importSummary.dupes > 0 && importSummary.valid === 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {importSummary.message}
                </div>
              )}
              {importSummary.warning && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">{importSummary.warning}</div>
              )}
            </>
          )}
          <p className="text-xs text-slate-400 mt-3">{rawData.length.toLocaleString()} records currently in the database. Duplicate detection uses Date + Job Number + Machine + Operator + Shift as the unique key.</p>
        </Card>
      )}
    </div>
  );
}

/* ============================== PAGE: OT / READY TO PRINT ============================== */
const OT_MACHINE_TEMPLATE = [
  ["FLEXO", 39, 0, 4, 29, 0, 0, "PEPCO / Next / Tesco/"],
  ["NYLO", 4, 0, 0, 0, 0, 0, "Puma / Next / Tesco / Otto / Bonprix"],
  ["SCREEN PRINT", 9, 0, 0, 9, 0, 0, "H&M / Tesco / Renfold / Startex"],
  ["CUTTING", 39, 0, 4, 29, 0, 0, "Okaidi / Puma / H&M / Guess USA"],
  ["BLOCK MAKING", 1, 0, 0, 1, 0, 0, "Teddy S.P.A / Calzedonia / Kariban"],
  ["QURING", 1, 0, 0, 0, 0, 0, ""],
  ["RIBBON SLIDING", 2, 0, 0, 2, 0, 0, "Carter's / Others / Signet Enterprise"],
  ["OFFICE STUFF", 15, 0, 0, 0, 0, 0, "Carter's / Others / Signet Enterprise"],
  ["", 0, 0, 0, 0, 0, 0, "Garan / Puma / Tesco / H&M / Okaidi"],
  ["", 0, 0, 0, 0, 0, 0, "Supporting"],
  ["", 0, 0, 0, 0, 0, 0, "Puma / Next / Carter's / Target USA"],
];

const blankOTRow = (i) => ({
  sl: i + 1, mc: "", totalHC: "", h2: "", h3: "", h4: "", h5: "", h6: "",
  otHour: "", otCost: "", tiffin: "", night: "", buyer: "", reason: "", target: ""
});

function OTPage({ documents, onSave, onDelete }) {
  const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
  const makeDoc = () => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    date: today(), company: "MONTRIMS LTD | TRIMS INTERNATIONAL (BD) LTD.",
    rows: OT_MACHINE_TEMPLATE.map((r, i) => ({ sl: i + 1, mc: r[0], totalHC: r[1], h2: r[2], h3: r[3], h4: r[4], h5: r[5], h6: r[6], otHour: "", otCost: "", tiffin: "", night: "", buyer: r[7], reason: "", target: "" })),
    lineManager: "", gmProduction: ""
  });
  const [doc, setDoc] = useState(() => documents[0] || makeDoc());
  const [saved, setSaved] = useState(Boolean(documents.length));

  useEffect(() => {
    if (!documents.length && !doc?.id) setDoc(makeDoc());
  }, []);

  const updateRow = (idx, key, value) => setDoc(d => ({ ...d, rows: d.rows.map((r,i) => i === idx ? { ...r, [key]: value } : r) }));
  const addRow = () => setDoc(d => ({ ...d, rows: [...d.rows, blankOTRow(d.rows.length)] }));
  const removeRow = (idx) => setDoc(d => ({ ...d, rows: d.rows.filter((_,i) => i !== idx).map((r,i) => ({...r, sl:i+1})) }));
  const num = v => Number(v) || 0;
  const rowOtHours = r => num(r.h2)*2 + num(r.h3)*3 + num(r.h4)*4 + num(r.h5)*5 + num(r.h6)*6;
  const rowOtCost = r => num(r.h3)*3*80 + num(r.h4)*4*80 + num(r.h5)*5*80 + num(r.h6)*6*80 + num(r.h2)*2*80;
  const totalOT = doc.rows.reduce((a,r)=>a+rowOtHours(r),0);
  const totalCost = doc.rows.reduce((a,r)=>a+rowOtCost(r)+num(r.tiffin)+num(r.night),0);
  const save = () => { const next = { ...doc, rows: doc.rows.map(r => ({...r, otHour: rowOtHours(r), otCost: rowOtCost(r)})), savedAt: new Date().toISOString() }; setDoc(next); onSave(next); setSaved(true); };
  const newDoc = () => { setDoc(makeDoc()); setSaved(false); };
  const loadDoc = d => { setDoc(d); setSaved(true); };

  return <div className="ot-page">
    <div className="ot-toolbar no-print">
      <div><SectionTitle>OT</SectionTitle><p className="text-sm text-slate-500">Overtime Approval Sheet — manually update, save, then print.</p></div>
      <div className="ot-actions">
        <button className="ot-btn secondary" onClick={newDoc}><Plus size={16}/> New OT</button>
        <button className="ot-btn primary" onClick={save}><Save size={16}/> Save</button>
        <button className="ot-btn print" onClick={() => window.print()} disabled={!saved}><Printer size={16}/> Ready to Print</button>
      </div>
    </div>

    <div className="ot-layout">
      <Card className="ot-editor no-print">
        <div className="ot-editor-head"><strong>Saved OT Sheets</strong><span>{documents.length}</span></div>
        {documents.length === 0 ? <div className="ot-empty">No saved OT sheet yet.</div> : documents.map(d => <div key={d.id} className="ot-saved-item"><button onClick={()=>loadDoc(d)}><FileText size={15}/><span>{d.date || "No date"}</span></button><button className="delete" onClick={()=>onDelete(d.id)}><Trash2 size={14}/></button></div>)}
        <div className="ot-help">Fill the editable cells in the sheet. Save makes the current version Ready to Print. Saved sheets stay in this browser.</div>
      </Card>

      <div className="ot-print-sheet">
        <div className="ot-header">
          <div><input className="ot-company" value={doc.company} onChange={e=>setDoc({...doc,company:e.target.value})}/><h1>Overtime (OT) Approval Sheet</h1></div>
          <label>Date<input type="date" value={doc.date} onChange={e=>setDoc({...doc,date:e.target.value})}/></label>
        </div>

        <div className="ot-category-grid">
          {[["Sewing Thread","Yarn Dyeing"],["Woven Label","Continuous Dyeing"],["Printed Label","Gum Tape"],["Screen Print","Carton"],["Narrow Fabric","Quality"],["Rubber Patch","Poly"],["Heat Print","Hanger"],["Offset","PVC"],["Thermal",""]].map((x,i)=><div key={i}><b>{x[0]}</b><span>{x[1]}</span></div>)}
        </div>

        <div className="ot-section-title">Worker</div>
        <div className="ot-table-wrap">
          <table className="ot-table">
            <thead><tr>
              <th>SL</th><th>M/C Name / Work Area</th><th>Total HC</th><th>OT HC<br/>2HR</th><th>OT HC<br/>3HR</th><th>OT HC<br/>4HR</th><th>OT HC<br/>5HR</th><th>OT HC<br/>6HR</th><th>Total OT<br/>Hour</th><th>OT Cost</th><th>Tiffin<br/>Bill</th><th>Night<br/>Bill</th><th>Total<br/>Cost</th><th>Buyer Name</th><th className="no-print">Action</th>
            </tr></thead>
            <tbody>{doc.rows.map((r,i)=>{
              const oh=rowOtHours(r), oc=rowOtCost(r), tc=oc+num(r.tiffin)+num(r.night);
              return <tr key={r.sl}>
                <td>{r.sl}</td>
                <td><input value={r.mc} onChange={e=>updateRow(i,"mc",e.target.value)}/></td>
                <td><input type="number" value={r.totalHC} onChange={e=>updateRow(i,"totalHC",e.target.value)}/></td>
                {[["h2","2"],["h3","3"],["h4","4"],["h5","5"],["h6","6"]].map(([k])=><td key={k}><input type="number" min="0" value={r[k]} onChange={e=>updateRow(i,k,e.target.value)}/></td>)}
                <td className="calc">{oh}</td><td className="calc">{oc.toLocaleString()}</td>
                <td><input type="number" value={r.tiffin} onChange={e=>updateRow(i,"tiffin",e.target.value)}/></td>
                <td><input type="number" value={r.night} onChange={e=>updateRow(i,"night",e.target.value)}/></td>
                <td className="calc">{tc.toLocaleString()}</td>
                <td><input value={r.buyer} onChange={e=>updateRow(i,"buyer",e.target.value)}/></td>
                <td className="no-print"><button className="row-delete" onClick={()=>removeRow(i)}><Trash2 size={13}/></button></td>
              </tr>})}</tbody>
            <tfoot><tr><th colSpan="3">TOTAL</th><th colSpan="5"></th><th>{totalOT}</th><th>{doc.rows.reduce((a,r)=>a+rowOtCost(r),0).toLocaleString()}</th><th>{doc.rows.reduce((a,r)=>a+num(r.tiffin),0).toLocaleString()}</th><th>{doc.rows.reduce((a,r)=>a+num(r.night),0).toLocaleString()}</th><th>{totalCost.toLocaleString()}</th><th></th><th className="no-print"></th></tr></tfoot>
          </table>
        </div>
        <button className="ot-add no-print" onClick={addRow}><Plus size={15}/> Add Worker Row</button>

        <div className="ot-section-title">Worker / Production Target</div>
        <div className="ot-target-table">
          <table className="ot-table"><thead><tr><th>SL No.</th><th>M/C Name / Work Area</th><th>Total HC</th><th>OT HC</th><th>Total OT Hour</th><th>Production Target in OT Hour</th><th>Reason</th></tr></thead>
          <tbody>{doc.rows.slice(0,10).map((r,i)=><tr key={i}><td>{i+1}</td><td><input value={r.mc} onChange={e=>updateRow(i,"mc",e.target.value)}/></td><td><input type="number" value={r.totalHC} onChange={e=>updateRow(i,"totalHC",e.target.value)}/></td><td className="calc">{num(r.h2)+num(r.h3)+num(r.h4)+num(r.h5)+num(r.h6)}</td><td className="calc">{rowOtHours(r)}</td><td><input type="number" value={r.target} onChange={e=>updateRow(i,"target",e.target.value)}/></td><td><input value={r.reason} onChange={e=>updateRow(i,"reason",e.target.value)}/></td></tr>)}</tbody></table>
        </div>
        <div className="ot-signatures"><div>Line Manager: <b>{doc.lineManager || "________________"}</b></div><div>GM - Production: <b>{doc.gmProduction || "________________"}</b></div></div>
        <div className="ot-footer-status">{saved ? `Saved • Ready to Print • ${doc.savedAt ? new Date(doc.savedAt).toLocaleString() : ""}` : "Unsaved changes — press Save before printing."}</div>
      </div>
    </div>
  </div>;
}

/* ============================== PAGE: SETTINGS ============================== */
function SettingsPage({ settings, setSettings, canEdit }) {
  const [local, setLocal] = useState(settings);
  const save = () => setSettings(local);
  const field = (label, key, step = 1, suffix = "") => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-1">
        <input type="number" step={step} value={local[key]} disabled={!canEdit} onChange={(e) => setLocal((s) => ({ ...s, [key]: Number(e.target.value) }))}
          className="w-28 text-sm border border-slate-200 rounded-lg px-2 py-1.5 text-right disabled:bg-slate-50 disabled:text-slate-400" />
        <span className="text-xs text-slate-400 w-8">{suffix}</span>
      </div>
    </div>
  );
  return (
    <Card className="max-w-xl">
      {!canEdit && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          You have read-only access to Settings. Contact an Admin or Manager to change these values.
        </div>
      )}
      <SectionTitle>Dashboard Settings</SectionTitle>
      {field("Daily Production Target (global, all operators)", "dailyTarget", 500, "$")}
      {field("Below-Target Threshold (per operator/day)", "belowTarget", 10, "$")}
      {field("\"Near Target\" band (% of threshold)", "nearTargetPct", 1, "%")}
      {field("DHU Warning Threshold", "dhuWarn", 0.1, "%")}
      {field("DHU Critical Threshold", "dhuCrit", 0.1, "%")}
      <div className="flex items-center justify-between py-3 border-b border-slate-100">
        <span className="text-sm text-slate-600">Currency</span>
        <select value={local.currency} disabled={!canEdit} onChange={(e) => setLocal((s) => ({ ...s, currency: e.target.value }))} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 disabled:bg-slate-50 disabled:text-slate-400">
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="BDT">BDT</option>
        </select>
      </div>
      <button onClick={save} disabled={!canEdit} className="mt-4 w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed">Save Settings</button>
      <p className="text-xs text-slate-400 mt-3">Changes apply immediately across all KPIs, tables and charts once saved.</p>
    </Card>
  );
}
