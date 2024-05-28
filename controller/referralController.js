
 
 const refferl =async(req,res)=>{
    try {
    const refferalId=req.query.refferalId.trim()
    req.session.refferalId=refferalId
     res.redirect('/register')
    
    } catch (error) {
        console.log("error in refferal",error);
    }
}
module.exports={
    refferl
}