import PageHeader from "@/components/PageHeader"; import DeductionForm from "@/components/DeductionForm";
export default function Wastage(){return <><PageHeader title="Wastage Management" subtitle="Wastage is deducted batch-wise using FEFO and recorded in the ledger"/><DeductionForm mode="WASTAGE"/></>}
