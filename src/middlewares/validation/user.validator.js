import {body, param} from "express-validator";
import {userModel} from "../../models/user.models.js";

export const userIdValidation = [
    param("id")
    .isInt({min: 1}).withMessage("El id debe ser un numero entero positivo")
    .custom(async(id)=> {
        const role = await userModel.findByPk(id);
        if (!role) throw new Error("El usuario no existe");
        return true;
    }),
]; 

export const createUserValidation = [
    body("name")
        .notEmpty().withMessage("El nombre no debe ser vacio")
        .isLength({min:2, max:100}).withMessage("Los caracteres del nombre deben ser 2 minimo y 100 maximo"),
    body("email")
        .notEmpty().withMessage("El email no debe ser vacio")
        .isEmail().withMessage("El email debe ser valido")
        // valido si no tiene simbolos raros
        .custom(async(email)=>{
            const existe = await userModel.findOne({where: {email}});
            if (existe) throw new Error("El email ya esta registrado");
            return true;
        }),
    body("password")
        .notEmpty().withMessage("La password no debe ser vacio")
        .isLength({min:6}).withMessage("La password debe tener al menos 6 caracteres")
];

export const updateUserValidation = [
    body("name")
        .optional()
        .notEmpty().withMessage("El nombre no debe ser vacio"),
    body("email")
        .optional()
        .notEmpty().withMessage("El email no debe ser vacio")
        .isEmail().withMessage("El email debe ser valido")
        .custom(async(email, {req})=>{
            const existe = await userModel.findOne({where: {email}});
            if (existe && existe.id !== Number(req.params.id)) {
                throw new Error("El email ya esta registrado");
            }
            return true;
        }),
    body("password")
        .optional()
        .isLength({min:6}).withMessage("La password debe tener al menos 6 caracteres")
];