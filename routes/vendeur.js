var express = require('express');
var pool = require('../config/db')
var router = express.Router();
var auth = require('../midelwares/authorization')

router.get('/',auth, (req, res) => {
    let idvendeur=req.userID;
    let day = new Date().getDay();
    let dateActuelle = new Date().toISOString().split('T')[0]
    let consoRefuse = `(select count(id) from rejets where idvendeur=${idvendeur} and daterejet = "${dateActuelle}") as consoRefuse `;
    
    pool.query(`select (select B.quartier  from vendeur_day_zone as A join villes as B on A.idquartier=B.idquartier where A.day = ${day} and A.idvendeur=${idvendeur} ) as zone, (select A.nomprenom from users as A join resposablevendeur as B on A.id= B.idresponsable where B.idvendeur=${idvendeur}) as responsable, (select nomprenom from users where id=${idvendeur}) as vendeur, (select sum(pointtotal) from orders where idVendeur=${idvendeur} and (datecommande="${dateActuelle}")) as noteJour, (select count(id) from vendeurconsommateur where idvendeur=${idvendeur} and idconsommateur in (select id from users where quartier = (select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day}))) as nbrTotalConso, (select count(B.id) from orders as A join users as B on A.idconsommateur = B.id where A.idvendeur =${idvendeur} and A.datecommande="${dateActuelle}" and quartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day})) as consoValide, (select count(id) from users where id in (select idconsommateur from vendeurconsommateur where idvendeur=${idvendeur}) and quartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day}) and id not in (select DISTINCT idConsommateur from orders where idVendeur = ${idvendeur} and datecommande ="${dateActuelle}") and id not in (select idconsommateur from rejets where idvendeur=${idvendeur} and daterejet="${dateActuelle}")) as consoAttente, ${consoRefuse}`, (err, result) => {
        if (err) {
            console.log("Erreur dans la récupération des vendeur_dashboard : ", err);
            return res.status(500).json({})
        }
        else { 
            console.log(`(select count(id) from rejets where idvendeur=${idvendeur} and daterejet = ${dateActuelle}) as consoRefuse `,result[0].consoRefuse);
            return res.status(200).json(result);

        }
    })
})
router.get('/consoValide', auth, (req, res)=>{
    let idvendeur=req.userID
    let dateActuelle = new Date().toISOString().split('T')[0]
    let day = new Date().getDay();
    pool.query(`select A.*, B.*, "V" as etatDemande from orders as A join users as B on A.idconsommateur = B.id where idvendeur =${idvendeur} and datecommande="${dateActuelle}" and quartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day})`, (err, result) => {
        if (err) {
            console.log("Erreur dans la récupération des vendeur_dashboard : ", err);
            return res.status(500).json({})
        }
        else {
            return res.status(200).json(result);
        }
    })
})

router.get(`/getConsoGlobal`,auth,(req,res)=>{
    let idvendeur = req.userID
    let day = new Date().getDay();
    pool.query(`select * from users where id in (select idconsommateur from vendeurconsommateur where idvendeur=${idvendeur}) and quartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day})`, (err, result)=>{
        if (err) {
            console.log("Erreur dans la récupération des vendeur_dashboard getConsoGlobal: ", err);
            return res.status(500).json({})
        }else{
            return res.status(200).json(result);
        }
    })
})
router.post(`/getConsoGlobalByQuartier`,auth,(req,res)=>{
    let idquartier = req.body.idquartier
    let idvendeur = req.userID
    let day = new Date().getDay();
    pool.query(`select * from users where id in (select idconsommateur from vendeurconsommateur where idvendeur=${idvendeur} and idquartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day})) and quartier=${idquartier}`, (error, result)=>{
        if (error) {
            console.log("Erreur dans la récupération des vendeur_dashboard getConsoGlobalbyQuartier: ", err);
            return res.status(500).json({})
        }else{
            return res.status(200).json(result);
        }
    })
})
router.get('/consoAttente', auth, (req, res)=>{
    let idvendeur=req.userID
    let dateActuelle = new Date().toISOString().split('T')[0]
    let day = new Date().getDay();
    pool.query(`select *, "A" as etatDemande from users where id in (select idconsommateur from vendeurconsommateur where idvendeur=${idvendeur}) and quartier=(select idquartier from vendeur_day_zone where idvendeur=${idvendeur} and day=${day}) and id not in (select DISTINCT idConsommateur from orders where idVendeur = ${idvendeur} and datecommande ="${dateActuelle}") and id not in (select idconsommateur from rejets where idvendeur=${idvendeur} and daterejet="${dateActuelle}")`, (err, result) => {
        if (err) {
            console.log("Erreur dans la récupération des vendeur_dashboard : ", err);
            return res.status(500).json({})
        }
        else {
            return res.status(200).json(result);
        }
    })
})
router.get('/consoRefuse',auth,(req, res)=>{
    let idvendeur=req.userID
    let dateActuelle = new Date().toISOString().split('T')[0]
    let day = new Date().getDay();
    pool.query(`select *,"R" as etatDemande from users where id in (select idconsommateur from rejets where idvendeur=${idvendeur} and daterejet="${dateActuelle}")`, (err, result)=>{
        if (err) {
            console.log("Erreur dans la récupération des vendeur_dashboard : ", err);
            return res.status(500).json({})
        }
        else {
            return res.status(200).json(result);
        }
    })
})
router.post('/sendMofitRejectOreder', auth,(req, res)=>{
    let idvendeur = req.userID
    let idconsommateur = req.body.idconsommateur
    let motif = req.body.motif
    let dateActuelle = new Date().toISOString().split('T')[0]
    pool.query(`insert into rejets (idvendeur, idconsommateur, daterejet,motif) values (${idvendeur}, ${idconsommateur}, "${dateActuelle}", ${motif})`, (err, ok)=>{
        if (err) {
            console.log(err);
            return res.status(500).json({err})
        }else{
            console.log("rejetedc successfuly");
            return res.status(200).json({})
        }
    })
})
module.exports = router;
