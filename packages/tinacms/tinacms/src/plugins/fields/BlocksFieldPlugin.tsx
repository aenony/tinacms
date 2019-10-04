import * as React from 'react'
import { Field, Form } from '@tinacms/core'
import styled, { css } from 'styled-components'
import { FieldsBuilder } from '@tinacms/form-builder'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { Button } from '../../components/Button'
import {
  AddIcon,
  DragIcon,
  ReorderIcon,
  TrashIcon,
  LeftArrowIcon,
} from '@tinacms/icons'
import { GroupPanel, PanelHeader, PanelBody } from './GroupFieldPlugin'
import { Dismissible } from 'react-dismissible'
import { padding, color } from '@tinacms/styles'
import { useFrameContext } from '../../components/SyledFrame'

interface BlocksFieldDefinititon extends Field {
  component: 'blocks'
  defaultItem: object
  templates: {
    [key: string]: BlockTemplate
  }
}

interface BlockTemplate {
  label: string
  defaultItem: object
  key: string
  fields: Field[]
}

interface BlockFieldProps {
  input: any
  meta: any
  field: BlocksFieldDefinititon
  form: any
  tinaForm: Form
}

const Blocks = function({ tinaForm, form, field, input }: BlockFieldProps) {
  const frame = useFrameContext()
  let addItem = React.useCallback(
    (name, template) => {
      let obj = template.defaultItem || {}
      obj._template = name
      form.mutators.insert(field.name, 0, obj)
    },
    [form]
  )

  let items = input.value || []

  let [visible, setVisible] = React.useState(false)
  return (
    <>
      <GroupListHeader>
        <GroupLabel>{field.label || field.name}</GroupLabel>
        <GroupHeaderButton onClick={() => setVisible(true)} open={visible}>
          <AddIcon />
        </GroupHeaderButton>
        <BlockMenu open={visible}>
          <Dismissible
            click
            escape
            onDismiss={() => setVisible(false)}
            document={frame.document}
            disabled={!visible}
          >
            {Object.entries(field.templates).map(([name, template]) => (
              <BlockOption
                onClick={() => {
                  addItem(name, template)
                  setVisible(false)
                }}
              >
                {template.label}
              </BlockOption>
            ))}
          </Dismissible>
        </BlockMenu>
      </GroupListHeader>
      <GroupListPanel>
        <ItemList>
          <Droppable droppableId={field.name} type={field.name}>
            {(provider, snapshot) => (
              <div ref={provider.innerRef} className="edit-page--list-parent">
                {items.length === 0 && <EmptyState />}
                {items.map((block: any, index: any) => {
                  let template = field.templates[block._template]
                  if (!template) {
                    // TODO: if no template return invalid entry
                  }

                  return (
                    <BlockListItem
                      // TODO: Find beter solution for `key`. Using a value from the
                      // block will cause the panel to close if the key property is changed.
                      block={block}
                      template={template}
                      index={index}
                      field={field}
                      tinaForm={tinaForm}
                    />
                  )
                })}
                {provider.placeholder}
              </div>
            )}
          </Droppable>
        </ItemList>
      </GroupListPanel>
    </>
  )
}

const EmptyState = () => <EmptyList>There's no items</EmptyList>

interface BlockListItemProps {
  tinaForm: Form
  field: BlocksFieldDefinititon
  index: number
  block: any
  template: BlockTemplate
}

const BlockListItem = ({
  tinaForm,
  field,
  index,
  template,
  block,
}: BlockListItemProps) => {
  let [isExpanded, setExpanded] = React.useState<boolean>(false)

  let removeItem = React.useCallback(() => {
    tinaForm.finalForm.mutators.remove(field.name, index)
  }, [tinaForm, field, index])

  let label = block[template.key] || template.label

  return (
    <Draggable
      key={index}
      type={field.name}
      draggableId={`${field.name}.${index}`}
      index={index}
    >
      {(provider, snapshot) => (
        <>
          <ItemHeader
            ref={provider.innerRef}
            isDragging={snapshot.isDragging}
            {...provider.draggableProps}
            {...provider.dragHandleProps}
          >
            <DragHandle />
            <ItemClickTarget onClick={() => setExpanded(true)}>
              <GroupLabel>{label}</GroupLabel>
            </ItemClickTarget>
            <DeleteButton onClick={removeItem}>
              <TrashIcon />
            </DeleteButton>
          </ItemHeader>
          <Panel
            isExpanded={isExpanded}
            setExpanded={setExpanded}
            field={field}
            item={block}
            index={index}
            tinaForm={tinaForm}
            label={label}
            template={template}
          />
        </>
      )}
    </Draggable>
  )
}

const EmptyList = styled.div`
  text-align: center;
  border-radius: 0.3rem;
  background-color: #edecf3;
  color: #b2adbe;
  line-height: 1.35;
  padding: 0.75rem 0;
  font-size: 0.85rem;
  font-weight: 500;
`

const BlockMenu = styled.div<{ open: boolean }>`
  min-width: 12rem;
  border-radius: 1.5rem;
  border: 1px solid #efefef;
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate3d(0, 0, 0) scale3d(0.5, 0.5, 1);
  opacity: 0;
  pointer-events: none;
  transition: all 150ms ease-out;
  transform-origin: 100% 0;
  box-shadow: ${p => p.theme.shadow.big};
  background-color: white;
  overflow: hidden;
  z-index: 100;
  ${props =>
    props.open &&
    css`
      opacity: 1;
      pointer-events: all;
      transform: translate3d(0, 2.25rem, 0) scale3d(1, 1, 1);
    `};
`

const BlockOption = styled.button`
  position: relative;
  text-align: center;
  font-size: 0.75rem;
  padding: 0.75rem;
  font-weight: 500;
  width: 100%;
  background: none;
  cursor: pointer;
  outline: none;
  border: 0;
  transition: all 85ms ease-out;
  &:hover {
    color: ${color('primary')};
    background-color: #f6f6f9;
  }
  &:not(:last-child) {
    border-bottom: 1px solid #efefef;
  }
`

const ItemClickTarget = styled.div`
  flex: 1 1 0;
  min-width: 0;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
`

const GroupLabel = styled.span`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 500;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  transition: all 85ms ease-out;
  text-align: left;
`

const GroupListHeader = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  position: relative;
  ${GroupLabel} {
    font-size: 1rem;
  }
`

const GroupListPanel = styled.div`
  max-height: initial;
  position: relative;
  height: auto;
  margin-bottom: 1.5rem;
  border-radius: 0.3rem;
  background-color: #edecf3;
`

const GroupHeaderButton = styled(Button)<{ open: boolean }>`
  border-radius: 10rem;
  padding: 0;
  width: 1.75rem;
  height: 1.75rem;
  margin: -0.1rem 0 0 0;
  position: relative;
  fill: white;
  transform-origin: 50% 50%;
  transition: all 150ms ease-out;
  svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
    width: 1.5rem;
    height: 1.5rem;
  }
  &:focus {
    outline: none;
  }
  ${props =>
    props.open &&
    css`
      transform: rotate(45deg);
      background-color: white;
      fill: ${color('primary')};
      &:hover {
        background-color: #f6f6f9;
      }
    `};
`

const ItemList = styled.div``

const ItemHeader = styled.div<{ isDragging: boolean }>`
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  background-color: white;
  border: 1px solid #edecf3;
  margin: 0 0 -1px 0;
  overflow: visible;
  line-height: 1.35;
  padding: 0;
  font-size: 0.85rem;
  font-weight: 500;

  ${GroupLabel} {
    color: #282828;
    align-self: center;
    max-width: 100%;
  }

  svg {
    fill: #e1ddec;
    width: 1.25rem;
    height: auto;
    transition: fill 85ms ease-out;
  }

  &:hover {
    svg {
      fill: #433e52;
    }
    ${GroupLabel} {
      color: #0084ff;
    }
  }

  &:first-child {
    border-radius: 0.25rem 0.25rem 0 0;
  }

  &:nth-last-child(2) {
    border-radius: 0 0 0.25rem 0.25rem;
    &:first-child {
      border-radius: 0.3rem;
    }
  }

  ${p =>
    p.isDragging &&
    css`
      border-radius: 0.3rem;
      box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.12);

      svg {
        fill: #433e52;
      }
      ${GroupLabel} {
        color: #0084ff;
      }

      ${DragHandle} {
        svg:first-child {
          opacity: 0;
        }
        svg:last-child {
          opacity: 1;
        }
      }
    `};
`

const DeleteButton = styled.button`
  text-align: center;
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0.75rem 0.5rem;
  margin: 0;
  transition: all 85ms ease-out;
  &:hover {
    background-color: #f6f6f9;
  }
`

const DragHandle = styled(function DragHandle({ ...styleProps }) {
  return (
    <div {...styleProps}>
      <DragIcon />
      <ReorderIcon />
    </div>
  )
})`
  margin: 0;
  flex: 0 0 auto;
  width: 2rem;
  position: relative;
  fill: inherit;
  padding: 0.75rem 0;
  transition: all 85ms ease-out;
  &:hover {
    background-color: #f6f6f9;
    cursor: grab;
  }
  svg {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 1.25rem;
    height: 1.25rem;
    transform: translate3d(-50%, -50%, 0);
    transition: all 85ms ease-out;
  }
  svg:last-child {
    opacity: 0;
  }
  *:hover > & {
    svg:first-child {
      opacity: 0;
    }
    svg:last-child {
      opacity: 1;
    }
  }
`

interface PanelProps {
  setExpanded(next: boolean): void
  isExpanded: boolean
  tinaForm: Form
  index: number
  field: BlocksFieldDefinititon
  item: any
  label: string
  template: BlockTemplate
}

const Panel = function Panel({
  setExpanded,
  isExpanded,
  tinaForm,
  field,
  index,
  label,
  template,
}: PanelProps) {
  let fields: any[] = React.useMemo(() => {
    return template.fields.map((subField: any) => ({
      ...subField,
      name: `${field.name}.${index}.${subField.name}`,
    }))
  }, [template])

  return (
    <GroupPanel isExpanded={isExpanded}>
      <PanelHeader onClick={() => setExpanded(false)}>
        <LeftArrowIcon />
        <GroupLabel>{label}</GroupLabel>
      </PanelHeader>
      <PanelBody>
        {/* RENDER OPTIMIZATION: Only render fields of expanded fields.  */}
        {isExpanded ? <FieldsBuilder form={tinaForm} fields={fields} /> : null}
      </PanelBody>
    </GroupPanel>
  )
}

export default {
  name: 'blocks',
  Component: Blocks,
}
