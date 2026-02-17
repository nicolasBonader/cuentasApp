"""initial schema with bills tasks and driver_name

Revision ID: a75ea7c7a03e
Revises:
Create Date: 2026-02-17 19:55:36.877530

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a75ea7c7a03e'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    Assumes accounts, payment_methods, and payments tables already exist.
    Only adds new tables (bills, tasks) and new columns (driver_name, bill_id).
    """
    # Add driver_name column to accounts
    with op.batch_alter_table('accounts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('driver_name', sa.String(), nullable=True))

    # Create bills table (new)
    op.create_table('bills',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('account_id', sa.Integer(), nullable=False),
    sa.Column('external_id', sa.String(), nullable=False),
    sa.Column('amount_cents', sa.Integer(), nullable=False),
    sa.Column('currency', sa.String(), nullable=True),
    sa.Column('due_date', sa.Date(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('fetched_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_bills_id'), ['id'], unique=False)

    # Add bill_id FK to payments
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('bill_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_payments_bill_id', 'bills', ['bill_id'], ['id'])

    # Create tasks table (new)
    op.create_table('tasks',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('type', sa.String(), nullable=False),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('account_id', sa.Integer(), nullable=False),
    sa.Column('bill_id', sa.Integer(), nullable=True),
    sa.Column('result', sa.JSON(), nullable=True),
    sa.Column('error', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ),
    sa.ForeignKeyConstraint(['bill_id'], ['bills.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('tasks')

    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_payments_bill_id', type_='foreignkey')
        batch_op.drop_column('bill_id')

    with op.batch_alter_table('bills', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_bills_id'))
    op.drop_table('bills')

    with op.batch_alter_table('accounts', schema=None) as batch_op:
        batch_op.drop_column('driver_name')
