var express = require('express');
var pool = require('./../config/db')
var router = express.Router();
var auth = require('../midelwares/authorization')

router.get('/getOrdersConsommateur', auth, (req, res) => {

    pool.query(`select * from orders`, (err, result) => {
        if (err) {
            console.log("Erreur dans la récupération des demandes du consomateur : ", err);
            return res.status(500).json({})
        }
        else {
            return res.status(200).json(result);
        }
    })
})
// id, codecommande, prixtotal, pointtotal, datecommande, idConsommateur, idVendeur
// id, code-commande, quantite, id-product

router.post('/setOrdersConsommateur', auth, (req, res) => {
    let dateActuelle = new Date().toISOString().split('T')[0]
    let idconso = req.userID
    let idvendeur = req.body.order[0].user
    let codecommande = "C" + new Date().toLocaleString().replace(/\//g, '').replace(/ à /g, '').replace(/:/g, '');
    console.log(`insert into orders (codecommande, prixtotal, pointtotal, datecommande, idConsommateur, idVendeur) values
    ("${codecommande}", ${req.body.prixtotal}, ${req.body.pointtotal}, now(),${req.userID} ,${req.body.order[0].user})`);

    pool.query(`select * from orders where datecommande="${dateActuelle}" and idConsommateur=${idconso} and idVendeur=${idvendeur}`, (err, order)=>{
        if (err) {
            console.log(err);
            return res.status(500).json({})
        }else if(order.length>0 ){
            pool.query(`update orders set prixtotal=prixtotal+${req.body.prixtotal}, pointtotal=pointtotal+${req.body.pointtotal} where id=${order[0].id}`, (err, result) => {
            if (err) {
                console.log("Erreur dans l'insertion de la commande : ", err);
                return res.status(500).json({})
            }
            else {
                let finish = 0
                for (let i = 0; i < req.body.order.length; i++) {
                    pool.query(`insert into ordersdetails (codecommande, quantite, idproduct) values
            ("${order[0].codecommande}", ${req.body.order[i].quantite}, ${req.body.order[i].id})`, (err, result) => {
                        if (err) {
                            console.log("Erreur dans l'insertion de la commande : ", err);
                            return res.status(500).json({})
                        }
                        else {
                            finish++
                            if (finish === req.body.order.length) {
                                return res.status(200).json();
                            }
                        }
                    })
                }
            }
        })
        }else{
            pool.query(`insert into orders (codecommande, prixtotal, pointtotal, datecommande, idConsommateur, idVendeur) values
            ("${codecommande}", ${req.body.prixtotal}, ${req.body.pointtotal}, now(),${req.userID} ,${req.body.order[0].user})`, (err, result) => {
            if (err) {
                console.log("Erreur dans l'insertion de la commande : ", err);
                return res.status(500).json({})
            }
            else {
                let finish = 0
                for (let i = 0; i < req.body.order.length; i++) {
                    pool.query(`insert into ordersdetails (codecommande, quantite, idproduct) values
            ("${codecommande}", ${req.body.order[i].quantite}, ${req.body.order[i].id})`, (err, result) => {
                        if (err) {
                            console.log("Erreur dans l'insertion de la commande : ", err);
                            return res.status(500).json({})
                        }
                        else {
                            finish++
                            if (finish === req.body.order.length) {
                                return res.status(200).json();
                            }
                        }
                    })
                }
            }
        })
        }
    })

})

module.exports = router;