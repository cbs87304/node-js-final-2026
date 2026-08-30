const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString } = require("../utils/validUtils");

const creditPackageController = {
    async getCreditPackages(req, res, next) {
        const creditPackages = await dataSource.getRepository("CreditPackage").find({
            select: { id: true, name: true, credit_amount: true, price: true }
        });
        res.json({
            status: "success",
            data: creditPackages
        })
        return;
    },

    async postCreditPackage(req, res, next) {
        const { name, credit_amount, price } = req.body;
        if (!isValidString(name)) {
            next(appError(400, "欄位未填寫正確"));
            return;
        }
        if (
            credit_amount === undefined ||
            price === undefined ||
            credit_amount < 0 ||
            price < 0
        ) {
            next(appError(400, "欄位未填寫正確"));
            return;
        }


        const creditPackageRepo = dataSource.getRepository("CreditPackage");
        const findCreditPackage = await creditPackageRepo.findOneBy({ name: name.trim() })

        if (findCreditPackage) {
            next(appError(409, "資料重複"));
            return;
        }

        const newCreditPackage = await creditPackageRepo.save({ 
            name: name.trim(),
            credit_amount,
            price
         });

        res.status(201).json({
            status: "success",
            data: newCreditPackage
        })
        return;
    },

    async deleteCreditPackage(req, res, next) {
        const { creditPackageId } = req.params;
        const result = await dataSource.getRepository("CreditPackage").delete(creditPackageId);

        if (result.affected === 0) {
            next(appError(404, "ID錯誤"));
            return;
        };

        res.json({
            status: "success"
        })
        return;
    },
    async purchase(req, res, next){
        const { creditPackageId } = req.params;
        const repo = dataSource.getRepository("CreditPackage");
        const findPackage = await repo.findOneBy({ id: creditPackageId});
        if(!findPackage) {
            return next(appError(400, "ID錯誤"));
        }

        const purchaseRepo = dataSource.getRepository("CreditPurchase");
        await purchaseRepo.save({
            user_id: req.user.id,
            credit_package_id: findPackage.id,
            purchased_credits:findPackage.credit_amount,
            price_paid: findPackage.price
        })
        res.json({ status: "success", data: null })
    }
}
module.exports = creditPackageController