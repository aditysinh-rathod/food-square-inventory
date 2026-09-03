import PageHeader from "@/components/PageHeader"; import DeductionForm from "@/components/DeductionForm";
export default function Consumption(){return <><PageHeader title="Daily Consumption" subtitle="Automatically deducts from earliest-expiring valid batches using FEFO"/><DeductionForm mode="CONSUMPTION"/></>}
