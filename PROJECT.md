# QontakSales CRM - Scope

Modul yang aktif sekarang: Login, Register, Dashboard, Agents, Customers, dan COA.
Data wilayah (negara/provinsi/kabupaten/kecamatan/kelurahan) dipegang app `regions`,
customer tinggal nyimpan FK-nya. Backend sengaja dipecah per app biar nanti nambah
fitur baru gak perlu ngutak-atik modul yang udah jalan.
