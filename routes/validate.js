const joi = require('@hapi/joi');

//register validation
const regvalidation = data => {
    const regschema = {
        clientid: joi.string()
            .min(4)
            .required(),
        userid: joi.string()
            .min(6)
            .required(),
        username: joi.string()
            .min(6)
            .required(),
        password: joi.string()
            .min(6)
            .required(),
        emailid: joi.string()
            .min(6)
            .required()
            .email(),
        phone: joi.string()
            .min(10),
        role: joi.string()
    };

    return joi.validate(data, regschema);
};

//login validation
const loginvalidlation = data => {
    const logschema = {
        userid: joi.string()
            .min(6)
            .required(),
        password: joi.string()
            .min(6)
            .required()
    };
    return joi.validate(data, logschema);
};

module.exports.regvalidation = regvalidation;
module.exports.loginvalidlation = loginvalidlation;