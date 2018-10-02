'use strict';

const MAX_ELEMENTS = 1000;

module.exports = (app, DB, swaggerSpec) => {

	app.get('/api-docs.json', (req, res) => {
	  res.setHeader('Content-Type', 'application/json');
	  res.send(swaggerSpec);
	});

	/**
	 * @swagger
	 *
	 * /v1/history/get_actions:
	 *   post:
	 *     description: get_actions
	 *     requestBody:
 	 *       content:
 	 *         application/json:
 	 *           schema:
 	 *             type: object
 	 *             properties:
 	 *               pos:
 	 *                 type: number
 	 *                 default: -1
 	 *               offset:
 	 *                 type: number
 	 *                 default: 10
 	 *               account_name:
 	 *                 type: string
 	 *                 default: cryptolions1
 	 *               action_name:
 	 *                 type: string
 	 *                 default: all
	 */
    app.post('/v1/history/get_actions', getActionsPOST);

	/**
	 * @swagger
	 *
	 * /v1/history/get_actions/cryptolions1:
	 *   get:
	 *     description: Get Account actions
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - in: query
	 *         name: skip
	 *         description: Skip elements default (0).
	 *         required: false
	 *         type: number
	 *       - in: query
	 *         name: limit
	 *         description: Limit elements default (10).
	 *         required: false
	 *         type: number
	 *       - in: query
	 *         name: sort
	 *         description: Sort elements default (-1).
	 *         required: false
	 *         type: number
	 */
	app.get('/v1/history/get_actions/:account', getActions);

	/**
	 * @swagger
	 *
	 * /v1/history/get_actions/cryptolions1/sethash:
	 *   get:
	 *     description: Get Account actions by action name
	 *     produces:
	 *       - application/json
	 *     parameters:
	 *       - in: query
	 *         name: skip
	 *         description: Skip elements default (0).
	 *         required: false
	 *         type: number
	 *       - in: query
	 *         name: limit
	 *         description: Limit elements default (10).
	 *         required: false
	 *         type: number
	 *       - in: query
	 *         name: sort
	 *         description: Sort elements default (-1).
	 *         required: false
	 *         type: number
	 */
    app.get('/v1/history/get_actions/:account/:action', getActions);

	/**
	 * @swagger
	 *
	 * /v1/history/get_transaction:
	 *   post:
	 *     description: get_transaction
	 *     requestBody:
 	 *       content:
 	 *         application/json:
 	 *           schema:
 	 *             type: object
 	 *             properties:
 	 *               id:
 	 *                 type: string
	 */
    app.post('/v1/history/get_transaction', getTransactionPOST);

	/**
	 * @swagger
	 *
	 * /v1/history/get_transaction/${id}:
	 *   get:
	 *     description: Get Transaction by id
	 *     produces:
	 *       - application/json
	 */
    app.get('/v1/history/get_transaction/:id', getTransaction);

	/**
	 * @swagger
	 *
	 * /v1/history/get_controlled_accounts:
	 *   post:
	 *     description: get_controlled_accounts
	 *     requestBody:
 	 *       content:
 	 *         application/json:
 	 *           schema:
 	 *             type: object
 	 *             properties:
 	 *               controlling_account:
 	 *                 type: string
	 */
    app.post('/v1/history/get_controlled_accounts', getControlledAccountsPOST);

	/**
	 * @swagger
	 *
	 * /v1/history/get_controlled_accounts/${controlling_account}:
	 *   get:
	 *     description: Get controlled accounts
	 *     produces:
	 *       - application/json
	 */
    app.get('/v1/history/get_controlled_accounts/:controlling_account', getControlledAccounts);

	/**
	 * @swagger
	 *
	 * /v1/history/get_key_accounts:
	 *   post:
	 *     description: get_key_accounts
	 *     requestBody:
 	 *       content:
 	 *         application/json:
 	 *           schema:
 	 *             type: object
 	 *             properties:
 	 *               public_key:
 	 *                 type: string
	 */
    app.post('/v1/history/get_key_accounts', getKeyAccountsPOST);

	/**
	 * @swagger
	 *
	 * /v1/history/get_key_accounts/${public_key}:
	 *   get:
	 *     description: Get key accounts
	 *     produces:
	 *       - application/json
	 */
    app.get('/v1/history/get_key_accounts/:public_key', getKeyAccounts);


	// ========= Custom functions
	function getActions(req, res){
	    // default values
	    let skip = 0;
	    let limit = 10;
	    let sort = -1;
	    let accountName = String(req.params.account);
	    let action = String(req.params.action);
	
	    let query = { $or: [
				{"act.account": accountName}, 
				{"act.data.receiver": accountName}, 
				{"act.data.from": accountName}, 
				{"act.data.to": accountName},
				{"act.data.name": accountName},
				{"act.data.voter": accountName},
				{"act.authorization.actor": accountName}
		]};
	    if (action !== "undefined" && action !== "all"){
	    	query["act.name"] = action;
	    }
	
	    skip = (isNaN(Number(req.query.skip))) ? skip : Number(req.query.skip);
	    limit = (isNaN(Number(req.query.limit))) ? limit : Number(req.query.limit);
	    sort = (isNaN(Number(req.query.sort))) ? sort : Number(req.query.sort);
	
	    if (limit > MAX_ELEMENTS){
	    	return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
	    }
	    if (skip < 0 || limit < 0){
	    	return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
	    }
	    if (sort !== -1 && sort !== 1){
	    	return res.status(401).send(`Sort param must be 1 or -1`);
	    }
	    
	    DB.collection("action_traces").find(query).sort({"_id": sort}).skip(skip).limit(limit).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json({ actions: result });
	    });
	}

	function getActionsPOST(req, res){
		// default values
	    let skip = 0;
	    let limit = 10;
	    let sort = -1;
	    let accountName = String(req.body.account_name);
	    let action = String(req.body.action_name);
	
	    let query = { $or: [
				{"act.account": accountName}, 
				{"act.data.receiver": accountName}, 
				{"act.data.from": accountName}, 
				{"act.data.to": accountName},
				{"act.data.name": accountName},
				{"act.data.voter": accountName},
				{"act.authorization.actor": accountName}
		]};
	    if (action !== "undefined"){
	    	query["act.name"] = action;
	    }

	    let pos = Number(req.body.pos);
	    let offset = Number(req.body.offset);
	    if (!isNaN(pos) && !isNaN(offset)){
	    	sort = (pos < 0) ? -1: 1;
	    	limit = Math.abs(offset);
	    	skip =  Math.abs(offset * ( pos * -1 - 1 ));
	    }
	
	    if (limit > MAX_ELEMENTS){
	    	return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
	    }
	    if (skip < 0 || limit < 0){
	    	return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
	    }
	    if (sort !== -1 && sort !== 1){
	    	return res.status(401).send(`Sort param must be 1 or -1`);
	    }
	    
	    DB.collection("action_traces").find(query).sort({"_id": sort}).skip(skip).limit(limit).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json({ actions: result });
	    });
	}

	function getTransactionPOST(req, res){
		 let key = String(req.body.id);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { id: key };
		 DB.collection("transaction_traces").findOne(query, (err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}

	function getTransaction(req, res){
		 let key = String(req.params.id);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { id: key };
		 DB.collection("transaction_traces").findOne(query, (err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}

	function getControlledAccountsPOST(req, res){
		 let key = String(req.body.controlling_account);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { controlling_account: key };
		 DB.collection("account_controls").find(query).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}

	function getControlledAccounts(req, res){
		 let key = String(req.params.controlling_account);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { controlling_account: key };
		 DB.collection("account_controls").find(query).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}

	function getKeyAccountsPOST(req, res){
		 let key = String(req.body.public_key);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { public_key: key };
		 DB.collection("pub_keys").find(query).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}

	function getKeyAccounts(req, res){
		 let key = String(req.params.public_key);
		 if (key === "undefined"){
		 	return res.status(401).send("Wrong transactions ID!");
		 } 
		 let query = { public_key: key };
		 DB.collection("pub_keys").find(query).toArray((err, result) => {
				if (err){
					console.error(err);
					return res.status(500).end();
				};
				res.json(result);
	    });
	}
	//========= end Custom Functions
}


