const Router = require('restify-router').Router,
	router = new Router(),
	parser = require('js2xmlparser2')
	Actividad = require('../modelos/actividad');
	Institucion = require('../modelos/institucion'),
	Sequelize = require("sequelize"),
	sequelize=require('../connection'),
	CbController=require('../funciones/cabecera'),
	cb=new CbController();


router.get("/",function(req,res,next){
	console.log(Number(req.query.pagina));
	let pagina = cb.validaPagina(req.query.pagina);
	let limite = cb.validaLimite(req.query.limite,50);
	let name = cb.validaNombre(req.query.nombre);
	if(name&&pagina!=null&&limite!=null){
		let nombre= name.toString().split(',');
		let respuesta={actividad:[]};
		Actividad.findAll({
			offset: pagina*limite,
			where:{
				nombre:{
					$ilike: ('%'+nombre[0]+'%')
				}
			}
		}).then(datos=>{
			if(datos.length>0){
				for(let i=0;i<limite;i++){
					if(i<datos.length)
						respuesta.actividad.push({
							id:datos[i].idact,
							nombre:datos[i].nombre,
							url:`/actividades/${datos[i].idact}`
						});
					else
						break;
				}
				if(datos.length>limite){
					respuesta.links = new Object();
					respuesta.links.siguiente=(name=='%%')?
					`/actividades?pagina=${pagina+2}&limite=${limite}`:
					`/actividades?pagina=${pagina+2}&limite=${limite}&nombre=${nombre[0]}`;
				}
				if(pagina>0){
					if(!respuesta.links)
						respuesta.links=new Object();
					respuesta.links.anterior=(name=='%%')?
					`/actividades?pagina=${pagina}&limite=${limite}`:
					`/actividades?pagina=${pagina}&limite=${limite}&nombre=${nombre[0]}`;
				}
				switch(cb.validarCb(req.headers.accept)){
					case 'application/xml':
						res.setHeader('Content-Type', 'application/xml');
						res.status(200);
						res.end(parser("actividades",respuesta,{attributeString : "links",useCDATA:true}));
						break;
					case 'application/json':
						res.setHeader('Content-Type', 'application/json');
						res.json(200,respuesta);
						break;
					default:
						res.status(406);
						res.end();
						break;
				}
			}else{
				res.status(404);
				res.end();
			}
		});
	}else{
		res.status(400);
		res.end();
	}
});

router.get("/:id",function(req,res,next){
	if(parseInt(req.params.id)){
		Actividad.findById(
				req.params.id
		).then(datos=>{
			let actividad={
				idact:datos.idact,
				nombre:datos.nombre,
				url:`/actividades/${datos.idact}`,
				instituciones:`/actividades/${datos.idact}/instituciones`
			};
		switch(cb.validarCb(req.headers.accept)){
			case 'application/xml':
				res.setHeader('Content-Type', 'application/xml');
				res.status(200);
				res.end(parser("actividad",actividad,{useCDATA:true}));
				break;
			case 'application/json':
				res.setHeader('Content-Type', 'application/json');
				res.json(200,{actividad:actividad});
				break;
			default:
				res.status(406);
				res.end();
				break;
		}
		next();
		}).catch(err=>{
			res.status(404);
			res.end();
			next();	
		});
	}else{
		res.status(404);
		res.end();
		next();
	}
});

router.get("/:id/instituciones",function(req,res,next){
	let pagina = cb.validaPagina(req.query.pagina);
	let limite = cb.validaLimite(req.query.limite,50);
	let name = cb.validaNombre(req.query.nombre);
	if(name&&pagina!=null&&limite!=null){
		let respuesta={institucion:[]};
		let nombre= name.toString().split(',');
		if(parseInt(req.params.id)){
			Actividad.findOne({
				where:{
					idact:req.params.id
				},
				include:[{
					model: Institucion,
					offset: limite*pagina,
					where:{
						nombre:{
							$ilike: ('%'+nombre[0]+'%')
						}
					}
				}]
			}).then(actividades=>{
					if(actividades.institucions&&actividades.institucions.length>0){
						for(let i=0;i<limite;i++){
							if(i<actividades.institucions.length)
								respuesta.institucion.push({
									claveinstitucion:actividades.institucions[i].cveinstitucion,
									nombre:actividades.institucions[i].nombre,
									url:`/instituciones/${actividades.institucions[i].cveinstitucion}`	
								});
							else
								break;
						}
						if(actividades.institucions.length>limite){
							respuesta.links=new Object();
							respuesta.links.siguiente=(name=='%%')?
								`/actividades/${req.params.id}/instituciones?pagina=${pagina+2}&limite=${limite}`:
								`/actividades/${req.params.id}/instituciones?pagina=${pagina+2}&limite=${limite}&nombre=${nombre[0]}`;
						}
						
						if(pagina>0){
							if(!respuesta.links)
								respuesta.links=new Object();
							respuesta.links.anterior=(name=='%%')?
							`/actividades/${req.params.id}/instituciones?pagina=${pagina}&limite=${limite}`:
							`/actividades/${req.params.id}/instituciones?pagina=${pagina}&limite=${limite}&nombre=${nombre[0]}`;
						}
						switch(cb.validarCb(req.headers.accept)){
							case 'application/xml':
								res.setHeader('Content-Type', 'application/xml');
								res.status(200);
								res.end(parser("instituciones",respuesta,{attributeString : "links",useCDATA:true}));
							break;
							case 'application/json':
								res.setHeader('Content-Type', 'application/json');
								res.json(200,respuesta);
								break;
							default:
								res.status(406);
								res.end();
								break;
						}
					}else{
						res.status(404);
						res.end();
					}
				}).catch(err=>{
					res.status(400);
					res.end();
				});
		}else{
			res.status(404);
			res.end();
		}
	}else{
		res.status(400);
		res.end();
	}
	next();
});

router.get("/:id/instituciones/:cveInstitucion",function(req,res,next){
	if(parseInt(req.params.id)){
		Actividad.findOne({
			where:{
				idact:req.params.id
			},
			include:[{
				model: Institucion,
				where:{
					cveinstitucion: req.params.cveInstitucion
				}
			}]
		}).then(datos=>{
			let institucion={
				claveinstitucion:datos.institucions[0].cveinstitucion,
				nombre:datos.institucions[0].nombre,
				url:`/instituciones/${datos.institucions[0].cveinstitucion}`
			};
		switch(cb.validarCb(req.headers.accept)){
			case 'application/xml':
				res.setHeader('Content-Type', 'application/xml');
				res.status(200);
				res.end(parser("institucion",institucion,{useCDATA:true}));
				break;
			case 'application/json':
				res.setHeader('Content-Type', 'application/json');
				res.json(200,{institucion:institucion});
				break;
			default:
				res.status(406);
				res.end();
				break;
		}
		next();
		}).catch(err=>{
			res.status(404);
			res.end();
			next();	
		})
	}else{
		res.status(404);
		res.end();
		next();
	}
});

router.post("/",function(req,res,next){
	if(req.body.nombre && req.body.idact){
		return sequelize.transaction(t=>{
			return Actividad.create({
				idact: req.body.idact,
				nombre:req.body.nombre
			},{transaction:t});
		}).then(resultado=>{
			res.status(201);
			res.end();
			next();
		}).catch(err=>{
			res.status(400);
			res.end();
			next();
			throw err;
		});
	}else{
		res.status(400);
		res.end();
		next();
	}
});

router.put("/:id",function(req,res,next){
	if(parseInt(req.params.id)){
		return sequelize.transaction(t=>{
			return Actividad.update({
				nombre:req.body.nombre
			},{
				where:{
					idact:req.params.id
				}
			},{
				returning: true,
				plain: true,
				transaction:t
			});
		}).then(resultado=>{
			res.status(201);
			res.end();
			next();
		}).catch(err=>{
			res.status(400);
			res.end();
			next();
		});
	}else{
		res.status(400);
		res.end();
		next();
	}
});

router.del("/:id",function(req,res,next){
	if(parseInt(req.params.id)){
		return sequelize.transaction(t=>{
			return Actividad.destroy({
				where:{
					idact:req.params.id
				}
			},{transaction:t});
		}).then(resultado=>{
			if(resultado)
				res.status(204);
			else
				res.status(400);
			res.end();
			next();
		}).catch(err=>{
			res.status(400);
			res.end();
			next();
			throw err;
		});
	}else{
		res.status(400);
		res.end();
		next();
	}
});

module.exports = router;
